import type { ResolvedConfig } from "./config";
import { SouthpayError } from "./errors";
import { type Modal, createIframe, createModal, resolveContainer } from "./internal/iframe";
import { type EmbedMessage, parseEmbedMessage } from "./internal/messaging";
import { isSafeRedirectUrl } from "./internal/url";
import type { CheckoutCallbacks, CheckoutHandle, MountOptions } from "./types";

const DEFAULT_MIN_HEIGHT = 560;
const MAX_HEIGHT = 5_000;
const WIDGET_LOAD_TIMEOUT_MS = 20_000;

function dispatch(
  message: EmbedMessage,
  reference: string,
  callbacks: CheckoutCallbacks,
  setHeight: (px: number) => void,
): void {
  switch (message.event) {
    case "ready":
      callbacks.onReady?.();
      break;
    case "resize":
      setHeight(Math.min(message.height, MAX_HEIGHT));
      break;
    case "status":
      callbacks.onStatusChange?.({ reference, status: message.status });
      break;
    case "completed":
      if (callbacks.onCompleted) {
        callbacks.onCompleted({ reference, successUrl: message.successUrl });
      } else if (isSafeRedirectUrl(message.successUrl)) {
        window.location.assign(message.successUrl);
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

export function mountCheckout(config: ResolvedConfig, options: MountOptions): CheckoutHandle {
  if (!options.reference) {
    throw new SouthpayError("missing_reference", "mount requires a reference");
  }

  const origin = config.checkoutOrigin;
  const reference = String(options.reference);
  const minHeight = options.minHeight ?? DEFAULT_MIN_HEIGHT;
  const frame = createIframe(origin, reference, minHeight, config.nonce);
  const iframe = frame.iframe;

  const container = resolveContainer(options.container);
  if (options.container && !container) {
    throw new SouthpayError(
      "container_not_found",
      `mount container not found: ${String(options.container)}`,
    );
  }

  let modal: Modal | null = null;
  let ready = false;
  let sized = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;

  function onMessage(event: MessageEvent): void {
    if (event.origin !== origin || event.source !== iframe.contentWindow) return;
    const message = parseEmbedMessage(event.data);
    if (!message) return;

    if (message.event === "ready") {
      ready = true;
      clearTimeout(watchdog);
    }

    if (message.event === "resize" && !sized) {
      sized = true;
      frame.clearMinHeight();
    }

    dispatch(message, reference, options, frame.setHeight);
  }

  const handle: CheckoutHandle = {
    reference,
    unmount(): void {
      clearTimeout(watchdog);
      window.removeEventListener("message", onMessage);
      if (modal) modal.destroy();
      else iframe.remove();
      frame.destroy();
    },
  };

  window.addEventListener("message", onMessage);

  if (options.onError) {
    const onError = options.onError;
    iframe.addEventListener("error", () => {
      if (!ready)
        onError(new SouthpayError("widget_load_failed", "checkout widget failed to load"));
    });
    watchdog = setTimeout(() => {
      if (!ready) {
        onError(
          new SouthpayError(
            "widget_load_failed",
            `checkout widget did not load within ${WIDGET_LOAD_TIMEOUT_MS}ms`,
          ),
        );
      }
    }, WIDGET_LOAD_TIMEOUT_MS);
  }

  if (container) {
    container.append(iframe);
  } else {
    modal = createModal(iframe, () => handle.unmount(), frame.usesClasses);
  }

  return handle;
}
