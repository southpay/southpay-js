import { describe, expect, it } from "vitest";
import { parseEmbedMessage } from "../src/internal/messaging";

const S = "southpay:checkout";

describe("parseEmbedMessage", () => {
  it("rejects non-objects and foreign sources", () => {
    expect(parseEmbedMessage(null)).toBeNull();
    expect(parseEmbedMessage("ready")).toBeNull();
    expect(parseEmbedMessage({ source: "other", event: "ready" })).toBeNull();
    expect(parseEmbedMessage({ source: S })).toBeNull();
  });

  it("parses payload-free events", () => {
    expect(parseEmbedMessage({ source: S, event: "ready" })).toEqual({ event: "ready" });
    expect(parseEmbedMessage({ source: S, event: "expired" })).toEqual({ event: "expired" });
  });

  it("validates resize height", () => {
    expect(parseEmbedMessage({ source: S, event: "resize", height: 720 })).toEqual({
      event: "resize",
      height: 720,
    });
    expect(parseEmbedMessage({ source: S, event: "resize", height: "720" })).toBeNull();
    expect(parseEmbedMessage({ source: S, event: "resize", height: Number.NaN })).toBeNull();
    expect(parseEmbedMessage({ source: S, event: "resize", height: -1 })).toBeNull();
  });

  it("only accepts known statuses", () => {
    expect(parseEmbedMessage({ source: S, event: "status", status: "processing" })).toEqual({
      event: "status",
      status: "processing",
    });
    expect(parseEmbedMessage({ source: S, event: "status", status: "bogus" })).toBeNull();
    expect(parseEmbedMessage({ source: S, event: "status" })).toBeNull();
  });

  it("normalizes completed success_url to string | null", () => {
    expect(
      parseEmbedMessage({ source: S, event: "completed", success_url: "https://x.test" }),
    ).toEqual({
      event: "completed",
      successUrl: "https://x.test",
    });
    expect(parseEmbedMessage({ source: S, event: "completed" })).toEqual({
      event: "completed",
      successUrl: null,
    });
    expect(parseEmbedMessage({ source: S, event: "completed", success_url: 5 })).toEqual({
      event: "completed",
      successUrl: null,
    });
  });

  it("rejects unknown events", () => {
    expect(parseEmbedMessage({ source: S, event: "drain_wallet" })).toBeNull();
  });
});
