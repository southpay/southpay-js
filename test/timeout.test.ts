import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SouthPay } from "../src/client";
import type { SouthpayClient } from "../src/types";

describe("createCheckout timeout", () => {
  let southpay: SouthpayClient;

  beforeEach(() => {
    southpay = SouthPay("sp_pk_test_abc");
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts and reports a timeout error after the timeout", async () => {
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

    const promise = southpay.paymentIntents.create({
      amount: "1.00",
      currency: "EUR",
      timeoutMs: 1000,
    });
    const assertion = expect(promise).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
  });
});
