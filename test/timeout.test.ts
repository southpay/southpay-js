import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckout } from "../src/checkout";
import { configure, reset } from "../src/config";

describe("createCheckout timeout", () => {
  beforeEach(() => {
    reset();
    configure({ publishableKey: "sp_pk_test_abc" });
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts and reports a network error after the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );

    const promise = createCheckout({
      amount: 100,
      currency: "EUR",
      container: document.body,
      timeoutMs: 1000,
    });
    const assertion = expect(promise).rejects.toMatchObject({ code: "network_error" });

    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
  });
});
