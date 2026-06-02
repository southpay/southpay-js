import { configure } from "./config";
import type { SouthpayConfig } from "./types";

export { createCheckout, mount } from "./checkout";
export { SouthpayError, type SouthpayErrorCode } from "./errors";
export type {
  SouthpayConfig,
  CheckoutCallbacks,
  CheckoutEvent,
  CheckoutStatusEvent,
  CheckoutCompletedEvent,
  CreateCheckoutOptions,
  MountOptions,
  CheckoutHandle,
} from "./types";

/** Initialize the SDK with a publishable key. Call once before createCheckout. */
export function init(config: SouthpayConfig): void {
  configure(config);
}
