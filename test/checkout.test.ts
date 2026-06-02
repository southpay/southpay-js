import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckout } from "../src/checkout";
import { configure, reset } from "../src/config";
import { SouthpayError } from "../src/errors";

function mockFetch(result: { ok?: boolean; status?: number; body?: unknown }) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok: result.ok ?? true,
    status: result.status ?? 200,
    json: async () => result.body ?? {},
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("createCheckout", () => {
  beforeEach(() => {
    reset();
    configure({ publishableKey: "sp_pk_test_abc", checkoutOrigin: "https://pay.southpay.io" });
    document.body.innerHTML = "";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("posts the amount in major units with the publishable key", async () => {
    const fetchMock = mockFetch({ body: { reference: "ref_1" } });
    await createCheckout({ amount: 1050, currency: "EUR", container: document.body });

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

  it("rejects a non-integer amount", async () => {
    mockFetch({ body: { reference: "ref_1" } });
    await expect(
      createCheckout({ amount: 10.5, currency: "EUR", container: document.body }),
    ).rejects.toMatchObject({ code: "invalid_amount" });
  });

  it("throws when the response has no reference", async () => {
    mockFetch({ body: {} });
    await expect(
      createCheckout({ amount: 100, currency: "EUR", container: document.body }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("surfaces the server error message", async () => {
    mockFetch({ ok: false, status: 422, body: { error: { message: "amount is required" } } });
    await expect(
      createCheckout({ amount: 100, currency: "EUR", container: document.body }),
    ).rejects.toMatchObject({ code: "request_failed", message: "amount is required" });
  });

  it("mounts an iframe into the container", async () => {
    mockFetch({ body: { reference: "ref_1" } });
    const handle = await createCheckout({ amount: 100, currency: "EUR", container: document.body });

    const iframe = document.body.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toContain("https://pay.southpay.io/ref_1");
    expect(iframe?.src).toContain("embed=1");

    handle.unmount();
    expect(document.body.querySelector("iframe")).toBeNull();
  });

  it("throws before init", async () => {
    reset();
    mockFetch({ body: { reference: "ref_1" } });
    await expect(
      createCheckout({ amount: 100, currency: "EUR", container: document.body }),
    ).rejects.toBeInstanceOf(SouthpayError);
  });
});
