const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

function getChannelId(): string {
  const id = process.env.TELEGRAM_CHANNEL_ID;
  if (!id) throw new Error("TELEGRAM_CHANNEL_ID is not set");
  return id;
}

export async function sendTelegramMessage(
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}${getToken()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: getChannelId(),
        text,
        parse_mode: parseMode,
      }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

export async function sendTelegramPhoto(
  photoUrl: string,
  caption: string
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}${getToken()}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: getChannelId(),
        photo: photoUrl,
        caption,
        parse_mode: "HTML",
      }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram photo error:", error);
    return false;
  }
}

export function formatNewsForTelegram(
  title: string,
  excerpt: string,
  url: string
): string {
  return `<b>${title}</b>\n\n${excerpt}\n\n<a href="${url}">Читать далее</a>`;
}

export function formatEventForTelegram(
  title: string,
  date: string,
  location: string,
  description: string
): string {
  return `<b>${title}</b>\n\n${description}\n\n📅 ${date}\n📍 ${location}`;
}
