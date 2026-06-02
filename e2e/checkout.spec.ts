import { expect, test } from "@playwright/test";
import type { SouthpayClient, SouthpayClientOptions } from "../src/index";

const KEY = "sp_pk_test_e2e";
const CHECKOUT_ORIGIN_PATH = "/e2e/fixtures";
const REFERENCE = "blank.html";

declare global {
  interface Window {
    SouthPay: (publishableKey: string, options?: SouthpayClientOptions) => SouthpayClient;
    __cspViolations: string[];
  }
}

test.describe("default (inline styles, no CSP)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/fixtures/page.html");
    await page.waitForFunction(() => typeof window.SouthPay === "function");
  });

  test("mounts an iframe with least-privilege sandbox into a container", async ({ page }) => {
    await page.evaluate(
      ([key, path, reference]) => {
        const sp = window.SouthPay(key, { checkoutOrigin: location.origin + path });
        sp.checkout.mount({ reference, container: "#checkout" });
      },
      [KEY, CHECKOUT_ORIGIN_PATH, REFERENCE] as const,
    );

    const iframe = page.locator("#checkout iframe");
    await expect(iframe).toHaveAttribute("sandbox", /allow-scripts/);
    await expect(iframe).toHaveAttribute("allow", /payment/);
    await expect(iframe).toHaveAttribute("src", /blank\.html\?embed=1/);
    await expect(iframe).toHaveAttribute("style", /min-height/);
  });

  test("modal is an accessible dialog, locks scroll, and closes on Escape", async ({ page }) => {
    await page.evaluate(
      ([key, path, reference]) => {
        window
          .SouthPay(key, { checkoutOrigin: location.origin + path })
          .checkout.mount({ reference });
      },
      [KEY, CHECKOUT_ORIGIN_PATH, REFERENCE] as const,
    );

    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-southpay-modal]")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
});

test.describe("strict CSP with nonce", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        window.__cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    await page.goto("/e2e/fixtures/page-csp.html");
    await page.waitForFunction(() => typeof window.SouthPay === "function");
  });

  test("renders via a nonce'd stylesheet with no inline styles and no CSP violations", async ({
    page,
  }) => {
    await page.evaluate(
      ([key, path, reference]) => {
        window
          .SouthPay(key, { checkoutOrigin: location.origin + path, nonce: "testnonce" })
          .checkout.mount({ reference, container: "#checkout" });
      },
      [KEY, CHECKOUT_ORIGIN_PATH, REFERENCE] as const,
    );

    await expect(page.locator("style[data-southpay]")).toHaveCount(1);

    const iframe = page.locator("#checkout iframe");
    await expect(iframe).toHaveClass(/southpay-frame/);
    await expect(iframe).not.toHaveAttribute("style", /.+/);
    await expect(iframe).toHaveCSS("border-top-width", "0px");

    const violations = await page.evaluate(() => window.__cspViolations);
    expect(violations.filter((v) => v.startsWith("style-src"))).toEqual([]);
  });

  test("modal is styled by the stylesheet (class, not inline) under CSP", async ({ page }) => {
    await page.evaluate(
      ([key, path, reference]) => {
        window
          .SouthPay(key, { checkoutOrigin: location.origin + path, nonce: "testnonce" })
          .checkout.mount({ reference });
      },
      [KEY, CHECKOUT_ORIGIN_PATH, REFERENCE] as const,
    );

    const overlay = page.locator("[data-southpay-modal]");
    await expect(overlay).toHaveClass(/southpay-overlay/);
    await expect(overlay).not.toHaveAttribute("style", /.+/);
    await expect(overlay).toHaveCSS("position", "fixed");

    const violations = await page.evaluate(() => window.__cspViolations);
    expect(violations.filter((v) => v.startsWith("style-src"))).toEqual([]);
  });
});
