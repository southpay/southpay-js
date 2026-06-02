import { beforeEach, describe, expect, it } from "vitest";
import { checkoutOrigin, configure, requireConfig, reset } from "../src/config";
import { SouthpayError } from "../src/errors";

describe("configure", () => {
  beforeEach(() => reset());

  it("rejects a missing key", () => {
    expect(() => configure({ publishableKey: "" })).toThrow(SouthpayError);
  });

  it("rejects a secret key", () => {
    expect(() => configure({ publishableKey: "sp_sk_live_abc" })).toThrowError(/publishable key/);
    expect(() => configure({ publishableKey: "sp_live_abc" })).toThrow(SouthpayError);
  });

  it("accepts a publishable key and applies defaults", () => {
    const config = configure({ publishableKey: "sp_pk_test_abc" });
    expect(config.apiBase).toBe("https://api.southpay.io");
    expect(config.checkoutOrigin).toBe("https://pay.southpay.io");
  });

  it("strips trailing slashes from overrides", () => {
    const config = configure({
      publishableKey: "sp_pk_live_abc",
      apiBase: "https://api.example.com/",
      checkoutOrigin: "https://pay.example.com//",
    });
    expect(config.apiBase).toBe("https://api.example.com");
    expect(config.checkoutOrigin).toBe("https://pay.example.com");
  });

  it("requireConfig throws before init", () => {
    expect(() => requireConfig()).toThrow(SouthpayError);
  });

  it("checkoutOrigin falls back to the default before init", () => {
    expect(checkoutOrigin()).toBe("https://pay.southpay.io");
  });
});
