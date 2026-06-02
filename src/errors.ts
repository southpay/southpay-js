export type SouthpayErrorCode =
  | "invalid_publishable_key"
  | "invalid_config"
  | "invalid_amount"
  | "missing_currency"
  | "missing_reference"
  | "container_not_found"
  | "network_error"
  | "timeout"
  | "request_failed"
  | "invalid_response"
  | "widget_load_failed";

export class SouthpayError extends Error {
  readonly code: SouthpayErrorCode;
  readonly cause?: unknown;

  constructor(code: SouthpayErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "SouthpayError";
    this.code = code;
    if (options && "cause" in options) this.cause = options.cause;
  }
}

export function isSouthpayError(value: unknown): value is SouthpayError {
  if (value instanceof SouthpayError) return true;
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { name?: unknown }).name === "SouthpayError" &&
    typeof (value as { code?: unknown }).code === "string"
  );
}
