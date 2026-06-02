import { describe, expect, it } from "vitest";
import * as sdk from "../src/index";

const PUBLIC_API = ["SouthPay", "SouthpayError", "VERSION", "isSouthpayError"].sort();

describe("public API surface", () => {
  it("exports exactly the documented runtime members", () => {
    expect(Object.keys(sdk).sort()).toEqual(PUBLIC_API);
  });
});
