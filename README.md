# @southpay/js

Browser SDK for [SouthPay](https://southpay.io) crypto checkouts. Create a payment intent and mount a hosted, iframe-isolated checkout in a few lines.

[![npm version](https://img.shields.io/npm/v/@southpay/js.svg)](https://www.npmjs.com/package/@southpay/js)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@southpay/js.svg?label=gzip)](https://bundlephobia.com/package/@southpay/js)
[![types](https://img.shields.io/npm/types/@southpay/js.svg)](https://www.npmjs.com/package/@southpay/js)
[![license](https://img.shields.io/npm/l/@southpay/js.svg)](./LICENSE)

- **Zero dependencies**, side-effect-free, under 4 kB gzipped.
- Ships as **ESM, CommonJS, and a global `<script>`** with first-class TypeScript types.
- **No global state.** Test and live clients can coexist on the same page.
- **Secure by default.** Publishable keys only, origin- and source-checked `postMessage`, http(s)-only redirects, and a strict-CSP mode.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Guides](#guides)
  - [Browser-created checkout](#browser-created-checkout)
  - [Server-created checkout](#server-created-checkout)
  - [React](#react)
  - [Amounts](#amounts)
- [API reference](#api-reference)
- [Error handling](#error-handling)
- [Content Security Policy](#content-security-policy)
- [Security](#security)
- [Browser support](#browser-support)
- [Development](#development)
- [License](#license)

## Install

From npm:

```bash
npm install @southpay/js
```

```ts
import { SouthPay } from "@southpay/js";
```

Or load the hosted script, which exposes the same factory as a callable `window.SouthPay`:

```html
<script src="https://integrate.southpay.io/widgets/v2.js"></script>
```

`v2.js` tracks the latest 2.x release. For production, pin an exact version with [Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity):

```html
<script
  src="https://integrate.southpay.io/widgets/southpay-js-0.2.2.js"
  integrity="sha384-byogH/DkusWJmjYrsX1djrnBjaDk4TbiBo5Ew5spxFOBktdIdjhOj7FsET+NiOux"
  crossorigin="anonymous"
></script>
```

The npm package and the hosted script expose the same named exports.

## Quick start

You need a publishable key (`sp_pk_live_...` or `sp_pk_test_...`) from the dashboard. The SDK refuses any other key, so a secret key never reaches the browser.

Create a client once with your key, then reuse it:

```ts
import { SouthPay } from "@southpay/js";

const southpay = SouthPay("sp_pk_live_...");

const intent = await southpay.paymentIntents.create({ amount: "10.00", currency: "EUR" });

southpay.checkout.mount({
  reference: intent.reference,
  container: "#checkout",
  onCompleted: ({ reference }) => console.log("paid", reference),
});
```

With the hosted script, `SouthPay` is the same callable on `window`:

```html
<script src="https://integrate.southpay.io/widgets/v2.js"></script>
<script>
  const southpay = SouthPay("sp_pk_live_...");
</script>
```

## Guides

The flow is always two steps: obtain a payment intent `reference`, then mount its checkout. Where the intent is created decides which guide applies.

### Browser-created checkout

Create the payment intent in the browser, then mount it:

```ts
const intent = await southpay.paymentIntents.create({ amount: "10.00", currency: "EUR" });

southpay.checkout.mount({
  reference: intent.reference,
  container: "#checkout",
  onCompleted: ({ reference }) => console.log("paid", reference),
});
```

Because the amount is set in the browser, use this flow for donations or pay-what-you-want. For fixed-price goods, create the intent on your server instead (see below) so the buyer cannot change the amount.

Omit `container` to open the checkout in a focus-managed modal overlay.

### Server-created checkout

Create the intent on your server with a secret key, send the `reference` to the page, then mount it directly (no `paymentIntents.create` in the browser):

```ts
southpay.checkout.mount({
  reference: "REFERENCE_FROM_YOUR_SERVER",
  container: "#checkout",
  onCompleted: ({ successUrl }) => {
    if (successUrl) window.location.assign(successUrl);
  },
});
```

### React

The SDK is framework-agnostic. In React, create the client once and mount inside an effect, unmounting on cleanup:

```tsx
import { useEffect, useRef } from "react";
import { SouthPay } from "@southpay/js";

const southpay = SouthPay("sp_pk_live_...");

function Checkout({ reference }: { reference: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const handle = southpay.checkout.mount({
      reference,
      container: ref.current,
      onCompleted: ({ reference }) => console.log("paid", reference),
    });
    return () => handle.unmount();
  }, [reference]);

  return <div ref={ref} />;
}
```

A runnable version lives in [`examples/react`](./examples/react); a plain script-tag integration is in [`examples/html`](./examples/html).

### Amounts

`amount` is a decimal string in the currency's major units, never a `number`:

| Currency | Value      | `amount`  |
| -------- | ---------- | --------- |
| EUR      | 10.00 EUR  | `"10.00"` |
| USD      | 0.50 USD   | `"0.50"`  |
| JPY      | 1000 JPY   | `"1000"`  |

It is validated and canonicalized against the currency's ISO-4217 decimal places using string math (no floating point), and must be greater than zero. Passing a `number` is a type error.

## API reference

### `SouthPay(publishableKey, options?): SouthpayClient`

Creates a client. Resolves and validates config once.

| Argument                 | Required | Default                     | Notes                                                  |
| ------------------------ | -------- | --------------------------- | ------------------------------------------------------ |
| `publishableKey`         | yes      | -                           | `sp_pk_live_...` or `sp_pk_test_...`. Secret keys are rejected. |
| `options.apiBase`        | no       | `https://api.southpay.io`   | Validated; a non-http(s) value throws `invalid_config`. |
| `options.checkoutOrigin` | no       | `https://pay.southpay.io`   | Validated; a non-http(s) value throws `invalid_config`. |
| `options.nonce`          | no       | -                           | A CSP nonce. See [Content Security Policy](#content-security-policy). |

Returns `{ publishableKey, paymentIntents, checkout }`.

### `client.paymentIntents.create(params): Promise<PaymentIntent>`

Creates a payment intent and returns `{ reference }`.

| Param            | Type                       | Notes                                                       |
| ---------------- | -------------------------- | ---------------------------------------------------------- |
| `amount`         | `string`                   | Decimal string, major units. See [Amounts](#amounts).      |
| `currency`       | `string`                   | ISO-4217 code.                                              |
| `orderId`        | `string`                   | Optional.                                                   |
| `title`          | `string`                   | Optional.                                                   |
| `description`    | `string`                   | Optional.                                                   |
| `imageUrl`       | `string`                   | Optional.                                                   |
| `successUrl`     | `string`                   | Optional.                                                   |
| `failedUrl`      | `string`                   | Optional.                                                   |
| `metadata`       | `Record<string, unknown>`  | Optional.                                                   |
| `idempotencyKey` | `string`                   | Optional. Auto-generated per call if omitted.              |
| `signal`         | `AbortSignal`              | Optional. Cancel the request.                              |
| `timeoutMs`      | `number`                   | Optional. Defaults to 20000.                               |

The request is idempotent: a key is generated per call, or pass your own `idempotencyKey` so retries are safe.

### `client.checkout.mount(options): CheckoutHandle`

Renders the hosted checkout into a container, or as a modal when `container` is omitted.

| Option      | Type                    | Notes                                  |
| ----------- | ----------------------- | -------------------------------------- |
| `reference` | `string`                | Required. From a created intent.       |
| `container` | `string \| HTMLElement` | Optional. Selector or element. Omit for a modal. |
| `minHeight` | `number`                | Optional. Minimum iframe height.       |
| callbacks   | see below               | Optional lifecycle callbacks.          |

Returns a `CheckoutHandle`:

- `reference: string`
- `unmount(): void` removes the checkout and detaches its listeners.

### Callbacks

| Callback                                       | Fired when                                                   |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `onReady()`                                    | The checkout widget has loaded.                             |
| `onStatusChange({ reference, status })`        | Status changes. `status` is a [`CheckoutStatus`](#checkoutstatus). |
| `onCompleted({ reference, successUrl })`       | Payment completes. If omitted, the SDK navigates to a safe http(s) `successUrl`. |
| `onFailed({ reference, status })`              | Payment fails.                                              |
| `onExpired({ reference })`                     | The intent expires.                                        |
| `onError(error)`                               | The widget fails to load. Receives a `SouthpayError`.      |

### `CheckoutStatus`

`"created" | "pending" | "confirming" | "processing" | "completed" | "failed" | "expired"`

### `VERSION`

The package version string, also sent as the `x-southpay-client` header on the create request.

## Error handling

Methods throw `SouthpayError` with a typed `code`:

```ts
import { isSouthpayError } from "@southpay/js";

try {
  await southpay.paymentIntents.create({ amount: "10.00", currency: "EUR" });
} catch (err) {
  if (isSouthpayError(err)) {
    console.error(err.code, err.message);
  }
}
```

`isSouthpayError(err)` narrows safely across bundlers and realms (it checks `name` and `code`, not just `instanceof`).

Codes: `invalid_publishable_key`, `invalid_config`, `invalid_amount`, `missing_currency`, `missing_reference`, `container_not_found`, `network_error`, `timeout`, `request_failed`, `invalid_response`, `widget_load_failed`.

## Content Security Policy

The hosted checkout runs in an iframe, so allow it in your policy:

```
frame-src https://pay.southpay.io;
connect-src https://api.southpay.io;
```

By default the SDK applies its styles inline, which needs `style-src 'unsafe-inline'`. To run under a strict `style-src` instead, pass the same nonce you put in your CSP header:

```ts
const southpay = SouthPay("sp_pk_live_...", { nonce: "<your-csp-nonce>" });
```

With a nonce, the SDK injects a single nonce'd stylesheet and emits no inline styles, so `style-src 'self' 'nonce-<your-csp-nonce>'` is enough.

## Security

Only publishable keys reach the browser; the SDK rejects anything else. Inbound `postMessage` events are checked by both origin and source window, payloads are validated before dispatch, and redirects are restricted to http(s) URLs. To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## Browser support

Targets modern evergreen browsers. The SDK uses `fetch`, `AbortController`, and `postMessage`; `crypto.randomUUID` is used for idempotency keys when available and falls back gracefully when it is not.

## Development

```bash
npm install
npm run preflight   # lint, typecheck, test, build, check:exports, size
```

Individual steps:

```bash
npm run lint        # biome check .
npm run typecheck   # tsc --noEmit
npm test            # vitest (happy-dom)
npm run build       # tsup -> dist/ (ESM + CJS + IIFE + types)
npm run size        # size-limit (gzip budget)
npm run test:e2e    # build + playwright (run `npx playwright install` first)
```

## License

MIT
