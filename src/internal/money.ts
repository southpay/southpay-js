import { SouthpayError } from "../errors";

const EXPONENTS: Record<string, number> = {
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  MGA: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
  CLF: 4,
};

const AMOUNT_FORMAT = /^\d+(\.\d+)?$/;

export function normalizeAmount(amount: string, currency: string): string {
  if (typeof amount !== "string" || !AMOUNT_FORMAT.test(amount)) {
    throw new SouthpayError(
      "invalid_amount",
      'amount must be a positive decimal string in major units, e.g. "10.00"',
    );
  }

  const exponent = EXPONENTS[currency.toUpperCase()] ?? 2;
  const dot = amount.indexOf(".");
  const rawInt = dot === -1 ? amount : amount.slice(0, dot);
  const rawFrac = dot === -1 ? "" : amount.slice(dot + 1);
  if (rawFrac.length > exponent) {
    throw new SouthpayError(
      "invalid_amount",
      `amount supports at most ${exponent} decimal place(s) for ${currency.toUpperCase()}`,
    );
  }

  const intPart = rawInt.replace(/^0+(?=\d)/, "");
  if (intPart === "0" && /^0*$/.test(rawFrac)) {
    throw new SouthpayError("invalid_amount", "amount must be greater than zero");
  }

  if (exponent === 0) return intPart;

  return `${intPart}.${rawFrac.padEnd(exponent, "0")}`;
}
