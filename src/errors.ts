export type SouthpayErrorCode =
  | "not_initialized"
  | "invalid_publishable_key"
  | "invalid_amount"
  | "missing_currency"
  | "missing_reference"
  | "container_not_found"
  | "network_error"
  | "request_failed"
  | "invalid_response";

export class SouthpayError extends Error {
  readonly code: SouthpayErrorCode;

  constructor(code: SouthpayErrorCode, message: string) {
    super(message);
    this.name = "SouthpayError";
    this.code = code;
  }
}
