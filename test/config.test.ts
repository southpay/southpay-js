import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config";
import { SouthpayError } from "../src/errors";

describe("resolveConfig", () => {
  it("rejects a missing key", () => {
    expect(() => resolveConfig("")).toThrow(SouthpayError);
  });

  it("rejects a secret key", () => {
    expect(() => resolveConfig("sp_sk_live_abc")).toThrowError(/publishable key/);
    expect(() => resolveConfig("sp_live_abc")).toThrow(SouthpayError);
  });

  it("accepts a publishable key and applies defaults", () => {
    const config = resolveConfig("sp_pk_test_abc");
    expect(config.publishableKey).toBe("sp_pk_test_abc");
    expect(config.apiBase).toBe("https://api.southpay.io");
    expect(config.checkoutOrigin).toBe("https://pay.southpay.io");
  });

  it("strips trailing slashes from overrides", () => {
    const config = resolveConfig("sp_pk_live_abc", {
      apiBase: "https://api.example.com/",
      checkoutOrigin: "https://pay.example.com//",
    });
    expect(config.apiBase).toBe("https://api.example.com");
    expect(config.checkoutOrigin).toBe("https://pay.example.com");
  });

  it("rejects a non-URL or non-http override", () => {
    expect(() => resolveConfig("sp_pk_test_abc", { apiBase: "not a url" })).toThrowError(
      /apiBase must be a valid URL/,
    );
    expect(() =>
      resolveConfig("sp_pk_test_abc", { checkoutOrigin: "ftp://pay.example.com" }),
    ).toThrowError(/must use http/);
  });
});
