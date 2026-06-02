import type { CheckoutStatus } from "../types";

export const EMBED_SOURCE = "southpay:checkout";

export type EmbedMessage =
  | { event: "ready" }
  | { event: "resize"; height: number }
  | { event: "status"; status: CheckoutStatus }
  | { event: "completed"; successUrl: string | null }
  | { event: "failed"; status: CheckoutStatus }
  | { event: "expired" };

const STATUSES: ReadonlySet<string> = new Set<CheckoutStatus>([
  "created",
  "pending",
  "confirming",
  "processing",
  "completed",
  "failed",
  "expired",
]);

function isStatus(value: unknown): value is CheckoutStatus {
  return typeof value === "string" && STATUSES.has(value);
}

export function parseEmbedMessage(data: unknown): EmbedMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const message = data as Record<string, unknown>;
  if (message.source !== EMBED_SOURCE || typeof message.event !== "string") return null;

  switch (message.event) {
    case "ready":
      return { event: "ready" };
    case "expired":
      return { event: "expired" };
    case "resize":
      return typeof message.height === "number" &&
        Number.isFinite(message.height) &&
        message.height >= 0
        ? { event: "resize", height: message.height }
        : null;
    case "status":
      return isStatus(message.status) ? { event: "status", status: message.status } : null;
    case "failed":
      return isStatus(message.status) ? { event: "failed", status: message.status } : null;
    case "completed":
      return {
        event: "completed",
        successUrl: typeof message.success_url === "string" ? message.success_url : null,
      };
    default:
      return null;
  }
}
