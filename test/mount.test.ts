import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "../src/checkout";
import { configure, reset } from "../src/config";
import { SouthpayError } from "../src/errors";

const ORIGIN = "https://pay.southpay.io";

function emit(message: Record<string, unknown>, origin = ORIGIN): void {
  const event = new MessageEvent("message", {
    data: { source: "southpay:checkout", ...message },
  });
  Object.defineProperty(event, "origin", { value: origin });
  window.dispatchEvent(event);
}

describe("mount", () => {
  beforeEach(() => {
    reset();
    configure({ publishableKey: "sp_pk_test_abc", checkoutOrigin: ORIGIN });
    document.body.innerHTML = "";
  });

  it("requires a reference", () => {
    // @ts-expect-error testing the runtime guard
    expect(() => mount({})).toThrow(SouthpayError);
  });

  it("throws when the container selector matches nothing", () => {
    expect(() => mount({ reference: "ref_1", container: "#nope" })).toThrowError(
      /container not found/,
    );
  });

  it("opens a modal overlay when no container is given", () => {
    mount({ reference: "ref_1" });
    expect(document.querySelector("[data-southpay-modal]")).not.toBeNull();
  });

  it("ignores messages from another origin", () => {
    const onCompleted = vi.fn();
    mount({ reference: "ref_1", container: document.body, onCompleted });
    emit({ event: "completed", success_url: null }, "https://evil.example.com");
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("maps embed events to callbacks", () => {
    const onStatusChange = vi.fn();
    const onCompleted = vi.fn();
    const onExpired = vi.fn();
    mount({ reference: "ref_1", container: document.body, onStatusChange, onCompleted, onExpired });

    emit({ event: "status", status: "processing" });
    emit({ event: "completed", success_url: "https://shop.example.com/thanks" });
    emit({ event: "expired" });

    expect(onStatusChange).toHaveBeenCalledWith({ reference: "ref_1", status: "processing" });
    expect(onCompleted).toHaveBeenCalledWith({
      reference: "ref_1",
      successUrl: "https://shop.example.com/thanks",
    });
    expect(onExpired).toHaveBeenCalledWith({ reference: "ref_1" });
  });

  it("resizes the iframe on resize events", () => {
    mount({ reference: "ref_1", container: document.body });
    emit({ event: "resize", height: 720 });
    expect(document.body.querySelector("iframe")?.style.height).toBe("720px");
  });

  it("detaches the listener on unmount", () => {
    const onCompleted = vi.fn();
    const handle = mount({ reference: "ref_1", container: document.body, onCompleted });
    handle.unmount();
    emit({ event: "completed", success_url: null });
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
