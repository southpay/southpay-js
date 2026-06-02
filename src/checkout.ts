import { type ResolvedConfig, checkoutOrigin, requireConfig } from "./config";
import { SouthpayError } from "./errors";
import { createIframe, createModal, resolveContainer } from "./internal/iframe";
import { type EmbedMessage, isEmbedMessage } from "./internal/messaging";
import type {
  CheckoutCallbacks,
  CheckoutHandle,
  CreateCheckoutOptions,
  MountOptions,
} from "./types";
import { VERSION } from "./version";

const DEFAULT_MIN_HEIGHT = 560;
const DEFAULT_TIMEOUT_MS = 20_000;

function toMajorUnits(amount: number): string {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new SouthpayError("invalid_amount", "amount must be a positive integer in minor units");
  }
  return (amount / 100).toFixed(2);
}

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

async function createPaymentIntent(
  config: ResolvedConfig,
  options: CreateCheckoutOptions,
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
      throw new SouthpayError("network_error", "checkout request was aborted");
    }
    if (controller.signal.aborted) {
      throw new SouthpayError("network_error", `checkout request timed out after ${timeoutMs}ms`);
    }
    throw new SouthpayError(
      "network_error",
      `checkout request failed: ${(error as Error).message}`,
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

export async function createCheckout(options: CreateCheckoutOptions): Promise<CheckoutHandle> {
  const config = requireConfig();
  if (!options.currency) {
    throw new SouthpayError("missing_currency", "createCheckout requires a currency");
  }
  const amount = toMajorUnits(options.amount);
  const reference = await createPaymentIntent(config, options, amount);

  return mount({
    reference,
    container: options.container,
    minHeight: options.minHeight,
    onReady: options.onReady,
    onStatusChange: options.onStatusChange,
    onCompleted: options.onCompleted,
    onFailed: options.onFailed,
    onExpired: options.onExpired,
  });
}

export function mount(options: MountOptions): CheckoutHandle {
  if (!options.reference) {
    throw new SouthpayError("missing_reference", "mount requires a reference");
  }

  const origin = checkoutOrigin();
  const reference = String(options.reference);
  const minHeight = options.minHeight ?? DEFAULT_MIN_HEIGHT;
  const iframe = createIframe(origin, reference, minHeight);

  const container = resolveContainer(options.container);
  if (options.container && !container) {
    throw new SouthpayError(
      "container_not_found",
      `mount container not found: ${String(options.container)}`,
    );
  }

  let overlay: HTMLElement | null = null;

  function onMessage(event: MessageEvent): void {
    if (event.origin !== origin || !isEmbedMessage(event.data)) return;
    dispatch(event.data, reference, options, iframe);
  }

  const handle: CheckoutHandle = {
    reference,
    unmount(): void {
      window.removeEventListener("message", onMessage);
      (overlay ?? iframe).remove();
    },
  };

  window.addEventListener("message", onMessage);

  if (container) {
    container.append(iframe);
  } else {
    overlay = createModal(iframe, () => handle.unmount());
    document.body.append(overlay);
  }

  return handle;
}

function dispatch(
  message: EmbedMessage,
  reference: string,
  callbacks: CheckoutCallbacks,
  iframe: HTMLIFrameElement,
): void {
  switch (message.event) {
    case "ready":
      callbacks.onReady?.();
      break;
    case "resize":
      iframe.style.height = `${message.height}px`;
      break;
    case "status":
      callbacks.onStatusChange?.({ reference, status: message.status });
      break;
    case "completed":
      if (callbacks.onCompleted) {
        callbacks.onCompleted({ reference, successUrl: message.success_url });
      } else if (message.success_url) {
        window.location.assign(message.success_url);
      }
      break;
    case "failed":
      callbacks.onFailed?.({ reference, status: message.status });
      break;
    case "expired":
      callbacks.onExpired?.({ reference });
      break;
  }
}
