import { describe, expect, it } from "vitest";
import { normalizeAmount } from "../src/internal/money";

describe("normalizeAmount", () => {
  it("canonicalizes two-decimal currencies", () => {
    expect(normalizeAmount("10.50", "EUR")).toBe("10.50");
    expect(normalizeAmount("10.5", "EUR")).toBe("10.50");
    expect(normalizeAmount("10", "EUR")).toBe("10.00");
    expect(normalizeAmount("0.01", "EUR")).toBe("0.01");
  });

  it("drops the fraction for zero-decimal currencies", () => {
    expect(normalizeAmount("1000", "JPY")).toBe("1000");
    expect(normalizeAmount("5", "KRW")).toBe("5");
  });

  it("pads three-decimal currencies", () => {
    expect(normalizeAmount("1.234", "KWD")).toBe("1.234");
    expect(normalizeAmount("1.2", "KWD")).toBe("1.200");
  });

  it("strips leading zeros without losing precision", () => {
    expect(normalizeAmount("007.5", "EUR")).toBe("7.50");
    expect(normalizeAmount("1234567890.12", "EUR")).toBe("1234567890.12");
  });

  it("is case-insensitive on the currency code", () => {
    expect(normalizeAmount("1000", "jpy")).toBe("1000");
  });

  it("rejects too many decimal places for the currency", () => {
    expect(() => normalizeAmount("10.999", "EUR")).toThrowError(/at most 2 decimal/);
    expect(() => normalizeAmount("10.5", "JPY")).toThrowError(/at most 0 decimal/);
  });

  it("rejects zero, negatives, and non-decimal strings", () => {
    expect(() => normalizeAmount("0", "EUR")).toThrowError(/greater than zero/);
    expect(() => normalizeAmount("0.00", "EUR")).toThrowError(/greater than zero/);
    expect(() => normalizeAmount("-5", "EUR")).toThrowError(/major units/);
    expect(() => normalizeAmount("10.", "EUR")).toThrow();
    expect(() => normalizeAmount("abc", "EUR")).toThrow();
    expect(() => normalizeAmount(1000 as unknown as string, "EUR")).toThrow();
  });
});
