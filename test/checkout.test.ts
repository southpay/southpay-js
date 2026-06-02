import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SouthPay } from "../src/client";
import { SouthpayError } from "../src/errors";
import type { SouthpayClient } from "../src/types";

function mockFetch(result: { ok?: boolean; status?: number; body?: unknown }) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok: result.ok ?? true,
    status: result.status ?? 200,
    json: async () => result.body ?? {},
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("paymentIntents.create", () => {
  let southpay: SouthpayClient;

  beforeEach(() => {
    southpay = SouthPay("sp_pk_test_abc", { checkoutOrigin: "https://pay.southpay.io" });
    document.body.innerHTML = "";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("posts the canonicalized amount with the publishable key", async () => {
    const fetchMock = mockFetch({ body: { reference: "ref_1" } });
    const intent = await southpay.paymentIntents.create({ amount: "10.5", currency: "EUR" });
    expect(intent).toEqual({ reference: "ref_1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, request] = call;
    expect(url).toBe("https://api.southpay.io/api/v2/payments");
    expect((request.headers as Record<string, string>).authorization).toBe("Bearer sp_pk_test_abc");

    const body = JSON.parse(request.body as string);
    expect(body.payment_intent.amount).toBe("10.50");
    expect(body.payment_intent.currency).toBe("EUR");
  });

  it("sends an idempotency key and client header", async () => {
    const fetchMock = mockFetch({ body: { reference: "ref_1" } });
    await southpay.paymentIntents.create({ amount: "1.00", currency: "EUR" });

    const headers = (fetchMock.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers["idempotency-key"]).toBeTruthy();
    expect(headers["x-southpay-client"]).toMatch(/^southpay-js\//);
  });

  it("uses a caller-provided idempotency key", async () => {
    const fetchMock = mockFetch({ body: { reference: "ref_1" } });
    await southpay.paymentIntents.create({
      amount: "1.00",
      currency: "EUR",
      idempotencyKey: "fixed-key",
    });

    const headers = (fetchMock.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers["idempotency-key"]).toBe("fixed-key");
  });

  it("rejects an amount with too many decimal places for the currency", async () => {
    mockFetch({ body: { reference: "ref_1" } });
    await expect(
      southpay.paymentIntents.create({ amount: "10.999", currency: "EUR" }),
    ).rejects.toMatchObject({ code: "invalid_amount" });
  });

  it("throws when the response has no reference", async () => {
    mockFetch({ body: {} });
    await expect(
      southpay.paymentIntents.create({ amount: "1.00", currency: "EUR" }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("surfaces the server error message", async () => {
    mockFetch({ ok: false, status: 422, body: { error: { message: "amount is required" } } });
    await expect(
      southpay.paymentIntents.create({ amount: "1.00", currency: "EUR" }),
    ).rejects.toMatchObject({ code: "request_failed", message: "amount is required" });
  });

  it("creates an intent then mounts its reference", async () => {
    mockFetch({ body: { reference: "ref_1" } });
    const intent = await southpay.paymentIntents.create({ amount: "1.00", currency: "EUR" });
    const handle = southpay.checkout.mount({
      reference: intent.reference,
      container: document.body,
    });

    const iframe = document.body.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toContain("https://pay.southpay.io/ref_1");
    expect(iframe?.src).toContain("embed=1");

    handle.unmount();
    expect(document.body.querySelector("iframe")).toBeNull();
  });

  it("rejects a secret key at construction", () => {
    expect(() => SouthPay("sp_sk_live_abc")).toThrow(SouthpayError);
  });
});
