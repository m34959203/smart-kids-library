import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { trackTokenUsage } from "./token-tracker";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getModel(modelName: string = "gemini-2.0-flash"): GenerativeModel {
  return getClient().getGenerativeModel({ model: modelName });
}

export interface GeminiResponse {
  text: string;
  tokensUsed: number;
}

export async function generateText(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
    endpoint?: string;
  }
): Promise<GeminiResponse> {
  const model = getModel(options?.model);

  const parts = [];
  if (options?.systemPrompt) {
    parts.push({ text: `System: ${options.systemPrompt}\n\nUser: ${prompt}` });
  } else {
    parts.push({ text: prompt });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    },
  });

  const response = result.response;
  const text = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

  await trackTokenUsage(tokensUsed, options?.model ?? "gemini-2.0-flash", options?.endpoint ?? "general");

  return { text, tokensUsed };
}

export async function generateChat(
  messages: Array<{ role: "user" | "model"; content: string }>,
  systemPrompt?: string,
  endpoint?: string
): Promise<GeminiResponse> {
  const model = getModel();

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  const lastMessage = messages[messages.length - 1];
  const prompt = systemPrompt
    ? `${systemPrompt}\n\n${lastMessage.content}`
    : lastMessage.content;

  const result = await chat.sendMessage(prompt);
  const response = result.response;
  const text = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

  await trackTokenUsage(tokensUsed, "gemini-2.0-flash", endpoint ?? "chat");

  return { text, tokensUsed };
}

export async function generateJSON<T = unknown>(
  prompt: string,
  systemPrompt?: string
): Promise<{ data: T; tokensUsed: number }> {
  const response = await generateText(prompt, {
    systemPrompt: (systemPrompt ?? "") + "\nRespond ONLY with valid JSON, no markdown.",
    temperature: 0.3,
    endpoint: "json",
  });

  const cleaned = response.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const data = JSON.parse(cleaned) as T;
  return { data, tokensUsed: response.tokensUsed };
}
