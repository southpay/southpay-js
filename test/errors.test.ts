import { describe, expect, it } from "vitest";
import { SouthpayError, isSouthpayError } from "../src/errors";
import { isSafeRedirectUrl } from "../src/internal/url";

describe("isSouthpayError", () => {
  it("recognizes its own errors", () => {
    expect(isSouthpayError(new SouthpayError("timeout", "slow"))).toBe(true);
  });

  it("recognizes structurally-equivalent errors from another realm", () => {
    expect(isSouthpayError({ name: "SouthpayError", code: "network_error", message: "x" })).toBe(
      true,
    );
  });

  it("rejects unrelated values", () => {
    expect(isSouthpayError(new Error("nope"))).toBe(false);
    expect(isSouthpayError(null)).toBe(false);
    expect(isSouthpayError({ code: "timeout" })).toBe(false);
  });

  it("carries a cause when provided", () => {
    const cause = new Error("root");
    expect(new SouthpayError("network_error", "wrap", { cause }).cause).toBe(cause);
  });
});

describe("isSafeRedirectUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(isSafeRedirectUrl("https://shop.example.com/ok")).toBe(true);
    expect(isSafeRedirectUrl("http://localhost:3000/ok")).toBe(true);
  });

  it("rejects script, data, relative, and empty values", () => {
    expect(isSafeRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeRedirectUrl("/relative")).toBe(false);
    expect(isSafeRedirectUrl("")).toBe(false);
    expect(isSafeRedirectUrl(null)).toBe(false);
  });
});
