import type { ResolvedConfig } from "./config";
import { SouthpayError } from "./errors";
import type { CreatePaymentIntentParams } from "./types";
import { VERSION } from "./version";

const DEFAULT_TIMEOUT_MS = 20_000;

function newIdempotencyKey(provided?: string): string {
  if (provided) return provided;
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `idem_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } | string };
    if (typeof body.error === "string") return body.error;
    if (body.error?.message) return body.error.message;
  } catch {
    return `request failed with status ${response.status}`;
  }
  return `request failed with status ${response.status}`;
}

export async function createPaymentIntent(
  config: ResolvedConfig,
  options: CreatePaymentIntentParams,
  amount: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onExternalAbort);

  let response: Response;
  try {
    response = await fetch(`${config.apiBase}/api/v2/payments`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.publishableKey}`,
        "idempotency-key": newIdempotencyKey(options.idempotencyKey),
        "x-southpay-client": `southpay-js/${VERSION}`,
      },
      body: JSON.stringify({
        payment_intent: {
          amount,
          currency: options.currency,
          order_id: options.orderId,
          title: options.title,
          description: options.description,
          image_url: options.imageUrl,
          success_url: options.successUrl,
          failed_url: options.failedUrl,
          metadata: options.metadata,
        },
      }),
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw new SouthpayError("network_error", "checkout request was aborted", { cause: error });
    }
    if (controller.signal.aborted) {
      throw new SouthpayError("timeout", `checkout request timed out after ${timeoutMs}ms`, {
        cause: error,
      });
    }
    throw new SouthpayError(
      "network_error",
      `checkout request failed: ${(error as Error).message}`,
      {
        cause: error,
      },
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }

  if (!response.ok) {
    throw new SouthpayError("request_failed", await readErrorMessage(response));
  }

  const payload = (await response.json()) as { reference?: string; data?: { reference?: string } };
  const reference = payload.reference ?? payload.data?.reference;
  if (!reference) {
    throw new SouthpayError("invalid_response", "payment response did not include a reference");
  }
  return reference;
}
