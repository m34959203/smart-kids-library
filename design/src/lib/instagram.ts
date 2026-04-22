const GRAPH_API = "https://graph.facebook.com/v19.0";

function getAccessToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN is not set");
  return token;
}

function getAccountId(): string {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new Error("INSTAGRAM_ACCOUNT_ID is not set");
  return id;
}

export async function publishInstagramPost(
  imageUrl: string,
  caption: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `${GRAPH_API}/${getAccountId()}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: getAccessToken(),
        }),
      }
    );
    const containerData = await containerResponse.json();
    if (!containerData.id) {
      return { success: false, error: containerData.error?.message ?? "Failed to create container" };
    }

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `${GRAPH_API}/${getAccountId()}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: getAccessToken(),
        }),
      }
    );
    const publishData = await publishResponse.json();
    if (publishData.id) {
      return { success: true, postId: publishData.id };
    }
    return { success: false, error: publishData.error?.message ?? "Failed to publish" };
  } catch (error) {
    console.error("Instagram publish error:", error);
    return { success: false, error: String(error) };
  }
}

export function formatCaptionForInstagram(
  title: string,
  description: string,
  tags: string[] = []
): string {
  const hashtags = [
    "#SmartKidsLibrary",
    "#Satpayev",
    "#Библиотека",
    "#Дети",
    "#Книги",
    ...tags.map((t) => `#${t.replace(/\s+/g, "")}`),
  ].join(" ");

  return `${title}\n\n${description}\n\n${hashtags}`;
}
