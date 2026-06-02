export interface SouthpayConfig {
  /** Publishable key from the SouthPay dashboard (sp_pk_live_... or sp_pk_test_...). */
  publishableKey: string;
  /** API base URL. Defaults to https://api.southpay.io. */
  apiBase?: string;
  /** Hosted checkout origin. Defaults to the script origin, or https://pay.southpay.io. */
  checkoutOrigin?: string;
}

export interface CheckoutEvent {
  reference: string;
}

export interface CheckoutStatusEvent extends CheckoutEvent {
  status: string;
}

export interface CheckoutCompletedEvent extends CheckoutEvent {
  successUrl: string | null;
}

export interface CheckoutCallbacks {
  onReady?: () => void;
  onStatusChange?: (event: CheckoutStatusEvent) => void;
  onCompleted?: (event: CheckoutCompletedEvent) => void;
  onFailed?: (event: CheckoutStatusEvent) => void;
  onExpired?: (event: CheckoutEvent) => void;
}

export interface MountOptions extends CheckoutCallbacks {
  /** Reference returned when your server creates a payment intent. */
  reference: string;
  /** Element or CSS selector to mount into. Omit to open a modal overlay. */
  container?: string | HTMLElement;
  /** Minimum iframe height in pixels. Defaults to 560. */
  minHeight?: number;
}

export interface CreateCheckoutOptions extends CheckoutCallbacks {
  /** Amount in the minor unit of the currency (1000 = 10.00 EUR). */
  amount: number;
  /** ISO 4217 currency code, e.g. "EUR". */
  currency: string;
  orderId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  successUrl?: string;
  failedUrl?: string;
  metadata?: Record<string, unknown>;
  /** Idempotency key for the create request. Auto-generated when omitted. */
  idempotencyKey?: string;
  /** Abort the create request from your own controller. */
  signal?: AbortSignal;
  /** Create-request timeout in milliseconds. Defaults to 20000. */
  timeoutMs?: number;
  /** Element or CSS selector to mount into. Omit to open a modal overlay. */
  container?: string | HTMLElement;
  /** Minimum iframe height in pixels. Defaults to 560. */
  minHeight?: number;
}

export interface CheckoutHandle {
  readonly reference: string;
  /** Remove the checkout from the page and detach its listeners. */
  unmount(): void;
}
