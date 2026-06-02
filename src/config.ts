import { SouthpayError } from "./errors";
import type { SouthpayClientOptions } from "./types";

const DEFAULT_API_BASE = "https://api.southpay.io";
const DEFAULT_CHECKOUT_ORIGIN = "https://pay.southpay.io";
const PUBLISHABLE_KEY = /^sp_pk_(?:live|test)_[A-Za-z0-9]+$/;

export interface ResolvedConfig {
  readonly publishableKey: string;
  readonly apiBase: string;
  readonly checkoutOrigin: string;
  readonly nonce?: string;
}

function normalizeHttpUrl(value: string, field: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SouthpayError("invalid_config", `${field} must be a valid URL: ${value}`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SouthpayError("invalid_config", `${field} must use http(s): ${value}`);
  }
  return value.replace(/\/+$/, "");
}

export function resolveConfig(
  publishableKey: string,
  options: SouthpayClientOptions = {},
): ResolvedConfig {
  if (!publishableKey) {
    throw new SouthpayError("invalid_publishable_key", "SouthPay() requires a publishable key");
  }
  if (!PUBLISHABLE_KEY.test(publishableKey)) {
    throw new SouthpayError(
      "invalid_publishable_key",
      "SouthPay() requires a publishable key (sp_pk_...); never use a secret key in the browser",
    );
  }

  return {
    publishableKey,
    apiBase: normalizeHttpUrl(options.apiBase ?? DEFAULT_API_BASE, "apiBase"),
    checkoutOrigin: normalizeHttpUrl(
      options.checkoutOrigin ?? DEFAULT_CHECKOUT_ORIGIN,
      "checkoutOrigin",
    ),
    nonce: options.nonce,
  };
}
