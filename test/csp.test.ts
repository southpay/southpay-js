import { beforeEach, describe, expect, it } from "vitest";
import { SouthPay } from "../src/client";

const ORIGIN = "https://pay.southpay.io";

describe("CSP nonce styling", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("uses inline styles by default", () => {
    const southpay = SouthPay("sp_pk_test_abc", { checkoutOrigin: ORIGIN });
    southpay.checkout.mount({ reference: "ref_1", container: document.body });
    const iframe = document.body.querySelector("iframe");
    expect(iframe?.getAttribute("style")).toContain("min-height");
    expect(document.querySelector("style[data-southpay]")).toBeNull();
  });

  it("injects a nonce'd stylesheet and emits no inline iframe styles when a nonce is set", () => {
    const southpay = SouthPay("sp_pk_test_abc", { checkoutOrigin: ORIGIN, nonce: "abc123" });
    southpay.checkout.mount({ reference: "ref_1", container: document.body });

    const style = document.querySelector("style[data-southpay]") as HTMLStyleElement | null;
    expect(style).not.toBeNull();
    expect(style?.getAttribute("nonce") ?? style?.nonce).toBe("abc123");

    const iframe = document.body.querySelector("iframe");
    expect(iframe?.getAttribute("style")).toBeNull();
    expect(iframe?.classList.contains("southpay-frame")).toBe(true);
  });

  it("drives resize through the stylesheet rule, not inline styles, under a nonce", () => {
    const southpay = SouthPay("sp_pk_test_abc", { checkoutOrigin: ORIGIN, nonce: "abc123" });
    southpay.checkout.mount({ reference: "ref_1", container: document.body });
    const iframe = document.body.querySelector("iframe");
    if (!iframe) throw new Error("no iframe");

    const event = new MessageEvent("message", {
      data: { source: "southpay:checkout", event: "resize", height: 640 },
    });
    Object.defineProperty(event, "origin", { value: ORIGIN });
    Object.defineProperty(event, "source", { value: iframe.contentWindow });
    window.dispatchEvent(event);

    expect(iframe.getAttribute("style")).toBeNull();
    const sheetText = (document.querySelector("style[data-southpay]") as HTMLStyleElement).sheet
      ?.cssRules;
    const rules = Array.from(sheetText ?? []).map((r) => r.cssText);
    expect(rules.some((r) => r.includes("640px"))).toBe(true);
  });

  it("styles the modal with classes under a nonce", () => {
    const southpay = SouthPay("sp_pk_test_abc", { checkoutOrigin: ORIGIN, nonce: "abc123" });
    southpay.checkout.mount({ reference: "ref_1" });
    const overlay = document.querySelector("[data-southpay-modal]");
    expect(overlay?.classList.contains("southpay-overlay")).toBe(true);
    expect(overlay?.getAttribute("style")).toBeNull();
  });
});
