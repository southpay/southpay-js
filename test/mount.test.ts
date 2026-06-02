import { beforeEach, describe, expect, it, vi } from "vitest";
import { SouthPay } from "../src/client";
import { SouthpayError } from "../src/errors";
import type { MountOptions, SouthpayClient } from "../src/types";

const ORIGIN = "https://pay.southpay.io";

function emitFrom(source: Window | null, message: Record<string, unknown>, origin = ORIGIN): void {
  const event = new MessageEvent("message", {
    data: { source: "southpay:checkout", ...message },
  });
  Object.defineProperty(event, "origin", { value: origin });
  Object.defineProperty(event, "source", { value: source });
  window.dispatchEvent(event);
}

function mountedIframe(): HTMLIFrameElement {
  const iframe = document.body.querySelector("iframe");
  if (!iframe) throw new Error("no iframe mounted");
  return iframe;
}

describe("mount", () => {
  let southpay: SouthpayClient;

  beforeEach(() => {
    southpay = SouthPay("sp_pk_test_abc", { checkoutOrigin: ORIGIN });
    document.body.innerHTML = "";
  });

  it("requires a reference", () => {
    expect(() => southpay.checkout.mount({} as MountOptions)).toThrow(SouthpayError);
  });

  it("throws when the container selector matches nothing", () => {
    expect(() => southpay.checkout.mount({ reference: "ref_1", container: "#nope" })).toThrowError(
      /container not found/,
    );
  });

  it("opens a modal overlay when no container is given", () => {
    southpay.checkout.mount({ reference: "ref_1" });
    expect(document.querySelector("[data-southpay-modal]")).not.toBeNull();
  });

  it("ignores messages from another origin", () => {
    const onCompleted = vi.fn();
    southpay.checkout.mount({ reference: "ref_1", container: document.body, onCompleted });
    emitFrom(
      mountedIframe().contentWindow,
      { event: "completed", success_url: null },
      "https://evil.example.com",
    );
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("ignores messages from a window that is not the checkout iframe", () => {
    const onCompleted = vi.fn();
    southpay.checkout.mount({ reference: "ref_1", container: document.body, onCompleted });
    emitFrom(window, { event: "completed", success_url: "https://shop.example.com/ok" });
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("maps embed events to callbacks", () => {
    const onStatusChange = vi.fn();
    const onCompleted = vi.fn();
    const onExpired = vi.fn();
    southpay.checkout.mount({
      reference: "ref_1",
      container: document.body,
      onStatusChange,
      onCompleted,
      onExpired,
    });
    const source = mountedIframe().contentWindow;

    emitFrom(source, { event: "status", status: "processing" });
    emitFrom(source, { event: "completed", success_url: "https://shop.example.com/thanks" });
    emitFrom(source, { event: "expired" });

    expect(onStatusChange).toHaveBeenCalledWith({ reference: "ref_1", status: "processing" });
    expect(onCompleted).toHaveBeenCalledWith({
      reference: "ref_1",
      successUrl: "https://shop.example.com/thanks",
    });
    expect(onExpired).toHaveBeenCalledWith({ reference: "ref_1" });
  });

  it("drops status events with an unknown status", () => {
    const onStatusChange = vi.fn();
    southpay.checkout.mount({ reference: "ref_1", container: document.body, onStatusChange });
    emitFrom(mountedIframe().contentWindow, { event: "status", status: "wat" });
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("does not navigate to an unsafe success_url", () => {
    const assign = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    southpay.checkout.mount({ reference: "ref_1", container: document.body });
    emitFrom(mountedIframe().contentWindow, {
      event: "completed",
      success_url: "javascript:alert(1)",
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it("navigates to a safe success_url when no onCompleted is given", () => {
    const assign = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    southpay.checkout.mount({ reference: "ref_1", container: document.body });
    emitFrom(mountedIframe().contentWindow, {
      event: "completed",
      success_url: "https://shop.example.com/thanks",
    });
    expect(assign).toHaveBeenCalledWith("https://shop.example.com/thanks");
  });

  it("resizes the iframe on resize events", () => {
    southpay.checkout.mount({ reference: "ref_1", container: document.body });
    const iframe = mountedIframe();
    emitFrom(iframe.contentWindow, { event: "resize", height: 720 });
    expect(iframe.style.height).toBe("720px");
  });

  it("does not cross-talk between two mounted checkouts", () => {
    const a = vi.fn();
    const b = vi.fn();
    const first = document.createElement("div");
    const second = document.createElement("div");
    document.body.append(first, second);

    southpay.checkout.mount({ reference: "ref_a", container: first, onCompleted: a });
    southpay.checkout.mount({ reference: "ref_b", container: second, onCompleted: b });

    const firstWindow = { name: "a" } as unknown as Window;
    const secondWindow = { name: "b" } as unknown as Window;
    const firstIframe = first.querySelector("iframe");
    const secondIframe = second.querySelector("iframe");
    if (!firstIframe || !secondIframe) throw new Error("missing iframe");
    Object.defineProperty(firstIframe, "contentWindow", { value: firstWindow });
    Object.defineProperty(secondIframe, "contentWindow", { value: secondWindow });

    emitFrom(secondWindow, { event: "completed", success_url: null });

    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
  });

  it("detaches the listener on unmount", () => {
    const onCompleted = vi.fn();
    const handle = southpay.checkout.mount({
      reference: "ref_1",
      container: document.body,
      onCompleted,
    });
    const source = mountedIframe().contentWindow;
    handle.unmount();
    emitFrom(source, { event: "completed", success_url: null });
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
