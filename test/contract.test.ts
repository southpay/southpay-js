import { afterEach, describe, expect, it, vi } from "vitest";
import { SouthPay } from "../src/client";
import { parseEmbedMessage } from "../src/internal/messaging";

const INBOUND = {
  ready: { source: "southpay:checkout", event: "ready" },
  resize: { source: "southpay:checkout", event: "resize", height: 720 },
  status: { source: "southpay:checkout", event: "status", status: "processing" },
  completed: {
    source: "southpay:checkout",
    event: "completed",
    success_url: "https://shop.example.com/ok",
  },
  completedNoUrl: { source: "southpay:checkout", event: "completed" },
  failed: { source: "southpay:checkout", event: "failed", status: "failed" },
  expired: { source: "southpay:checkout", event: "expired" },
} as const;

describe("inbound checkout protocol (checkout iframe -> SDK)", () => {
  it("accepts and maps every documented event", () => {
    expect(parseEmbedMessage(INBOUND.ready)).toEqual({ event: "ready" });
    expect(parseEmbedMessage(INBOUND.resize)).toEqual({ event: "resize", height: 720 });
    expect(parseEmbedMessage(INBOUND.status)).toEqual({ event: "status", status: "processing" });
    expect(parseEmbedMessage(INBOUND.completed)).toEqual({
      event: "completed",
      successUrl: "https://shop.example.com/ok",
    });
    expect(parseEmbedMessage(INBOUND.completedNoUrl)).toEqual({
      event: "completed",
      successUrl: null,
    });
    expect(parseEmbedMessage(INBOUND.failed)).toEqual({ event: "failed", status: "failed" });
    expect(parseEmbedMessage(INBOUND.expired)).toEqual({ event: "expired" });
  });
});

describe("outbound create-intent protocol (SDK -> API)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs the documented payment_intent body and headers", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ reference: "ref_1" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await SouthPay("sp_pk_test_abc").paymentIntents.create({
      amount: "10.50",
      currency: "EUR",
      orderId: "order_1",
      title: "Title",
      description: "Description",
      imageUrl: "https://img.example.com/x.png",
      successUrl: "https://shop.example.com/ok",
      failedUrl: "https://shop.example.com/no",
      metadata: { plan: "pro" },
    });

    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch was not called");
    const [url, request] = call;
    const headers = request.headers as Record<string, string>;

    expect(url).toBe("https://api.southpay.io/api/v2/payments");
    expect(request.method).toBe("POST");
    expect(headers.authorization).toBe("Bearer sp_pk_test_abc");
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["idempotency-key"]).toBeTruthy();
    expect(headers["x-southpay-client"]).toMatch(/^southpay-js\//);
    expect(headers["x-client-version"]).toMatch(/^\d+\.\d+\.\d+/);

    expect(JSON.parse(request.body as string)).toEqual({
      payment_intent: {
        amount: "10.50",
        currency: "EUR",
        order_id: "order_1",
        title: "Title",
        description: "Description",
        image_url: "https://img.example.com/x.png",
        success_url: "https://shop.example.com/ok",
        failed_url: "https://shop.example.com/no",
        metadata: { plan: "pro" },
      },
    });
  });

  it("reads the reference from either the top level or a data envelope", async () => {
    const enveloped = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { reference: "ref_env" } }),
    }));
    vi.stubGlobal("fetch", enveloped);
    const intent = await SouthPay("sp_pk_test_abc").paymentIntents.create({
      amount: "1.00",
      currency: "EUR",
    });
    expect(intent).toEqual({ reference: "ref_env" });
  });
});
