export const EMBED_SOURCE = "southpay:checkout";

export type EmbedMessage =
  | { source: typeof EMBED_SOURCE; event: "ready" }
  | { source: typeof EMBED_SOURCE; event: "resize"; height: number }
  | { source: typeof EMBED_SOURCE; event: "status"; status: string }
  | { source: typeof EMBED_SOURCE; event: "completed"; success_url: string | null }
  | { source: typeof EMBED_SOURCE; event: "failed"; status: string }
  | { source: typeof EMBED_SOURCE; event: "expired" };

export function isEmbedMessage(data: unknown): data is EmbedMessage {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return record.source === EMBED_SOURCE && typeof record.event === "string";
}
