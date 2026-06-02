import type { SouthpayError } from "./errors";

export type CheckoutStatus =
  | "created"
  | "pending"
  | "confirming"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

export interface SouthpayClientOptions {
  apiBase?: string;
  checkoutOrigin?: string;
  nonce?: string;
}

export interface CheckoutEvent {
  reference: string;
}

export interface CheckoutStatusEvent extends CheckoutEvent {
  status: CheckoutStatus;
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
  onError?: (error: SouthpayError) => void;
}

export interface EmbedOptions extends CheckoutCallbacks {
  container?: string | HTMLElement;
  minHeight?: number;
}

export interface MountOptions extends EmbedOptions {
  reference: string;
}

export interface CreatePaymentIntentParams {
  amount: string;
  currency: string;
  orderId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  successUrl?: string;
  failedUrl?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface PaymentIntent {
  readonly reference: string;
}

export interface CheckoutHandle {
  readonly reference: string;
  unmount(): void;
}

export interface PaymentIntentsResource {
  create(params: CreatePaymentIntentParams): Promise<PaymentIntent>;
}

export interface CheckoutResource {
  mount(options: MountOptions): CheckoutHandle;
}

export interface SouthpayClient {
  readonly publishableKey: string;
  readonly paymentIntents: PaymentIntentsResource;
  readonly checkout: CheckoutResource;
}
