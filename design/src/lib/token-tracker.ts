import { query, getOne } from "./db";

interface TokenUsageRow {
  total_tokens: string;
}

export async function trackTokenUsage(
  tokens: number,
  model: string,
  endpoint: string
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];
    await query(
      `INSERT INTO token_usage (date, tokens_used, model, endpoint)
       VALUES ($1, $2, $3, $4)`,
      [today, tokens, model, endpoint]
    );
  } catch (error) {
    console.error("Failed to track token usage:", error);
  }
}

export async function getDailyTokenUsage(): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const result = await getOne<TokenUsageRow>(
      `SELECT COALESCE(SUM(tokens_used), 0) as total_tokens
       FROM token_usage WHERE date = $1`,
      [today]
    );
    return parseInt(result?.total_tokens ?? "0", 10);
  } catch {
    return 0;
  }
}

export async function isWithinTokenLimit(): Promise<boolean> {
  const limit = parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT ?? "1500000", 10);
  const used = await getDailyTokenUsage();
  return used < limit;
}

export async function getTokenUsageStats(days: number = 30) {
  try {
    const result = await query(
      `SELECT date, SUM(tokens_used) as total_tokens,
              COUNT(*) as request_count
       FROM token_usage
       WHERE date >= CURRENT_DATE - $1::integer
       GROUP BY date ORDER BY date DESC`,
      [days]
    );
    return result.rows;
  } catch {
    return [];
  }
}
