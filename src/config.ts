import { SouthpayError } from "./errors";
import type { SouthpayConfig } from "./types";

const DEFAULT_API_BASE = "https://api.southpay.io";
const DEFAULT_CHECKOUT_ORIGIN = "https://pay.southpay.io";
const PUBLISHABLE_KEY = /^sp_pk_(?:live|test)_/;

export interface ResolvedConfig {
  publishableKey: string;
  apiBase: string;
  checkoutOrigin: string;
}

let resolved: ResolvedConfig | null = null;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function detectScriptOrigin(): string {
  if (typeof document === "undefined") return DEFAULT_CHECKOUT_ORIGIN;
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script?.src) return DEFAULT_CHECKOUT_ORIGIN;
  try {
    return new URL(script.src).origin;
  } catch {
    return DEFAULT_CHECKOUT_ORIGIN;
  }
}

const scriptOrigin = detectScriptOrigin();

export function configure(options: SouthpayConfig): ResolvedConfig {
  if (!options?.publishableKey) {
    throw new SouthpayError("invalid_publishable_key", "init requires a publishableKey");
  }
  if (!PUBLISHABLE_KEY.test(options.publishableKey)) {
    throw new SouthpayError(
      "invalid_publishable_key",
      "init requires a publishable key (sp_pk_...); never use a secret key in the browser",
    );
  }
  resolved = {
    publishableKey: options.publishableKey,
    apiBase: stripTrailingSlash(options.apiBase ?? DEFAULT_API_BASE),
    checkoutOrigin: stripTrailingSlash(options.checkoutOrigin ?? scriptOrigin),
  };
  return resolved;
}

export function requireConfig(): ResolvedConfig {
  if (!resolved) {
    throw new SouthpayError(
      "not_initialized",
      "call init({ publishableKey }) before creating a checkout",
    );
  }
  return resolved;
}

export function checkoutOrigin(): string {
  return resolved ? resolved.checkoutOrigin : scriptOrigin;
}

export function reset(): void {
  resolved = null;
}
