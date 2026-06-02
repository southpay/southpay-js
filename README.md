# @southpay/js

Browser SDK for SouthPay crypto checkouts. No dependencies. Ships as ESM, CommonJS, and a global script.

## Install

```bash
npm install @southpay/js
```

Or load the hosted script, which exposes the same factory as a callable `window.SouthPay`:

```html
<script src="https://integrate.southpay.io/widgets/v2.js"></script>
```

`v2.js` tracks the latest 2.x release. For production, pin an exact version with Subresource Integrity:

```html
<script
  src="https://integrate.southpay.io/widgets/southpay-js-0.2.1.js"
  integrity="sha384-tFsgLnfHpprV3DORy6MfdmJvCGDM56DqXDOiA5qt/GEUK4q0cqe5k8tgX2/rcbDI"
  crossorigin="anonymous"
></script>
```

The npm package exposes the same named exports.

## Usage

You need a publishable key (`sp_pk_live_...` or `sp_pk_test_...`) from the dashboard. The SDK refuses any other key. Secret keys must never reach the browser.

Create a client once with your key, then reuse it. There is no global state, so a test client and a live client can coexist on the same page.

```ts
import { SouthPay } from "@southpay/js";

const southpay = SouthPay("sp_pk_live_...");
```

With the hosted script, `SouthPay` is the same callable on `window`:

```html
<script src="https://integrate.southpay.io/widgets/v2.js"></script>
<script>
  const southpay = SouthPay("sp_pk_live_...");
</script>
```

### Browser-created checkout

Create a payment intent, then mount its checkout:

```ts
const intent = await southpay.paymentIntents.create({ amount: "10.00", currency: "EUR" });

southpay.checkout.mount({
  reference: intent.reference,
  container: "#checkout",
  onCompleted: ({ reference }) => console.log("paid", reference),
});
```

`amount` is a decimal string in the currency's major units (`"10.00"` is 10.00 EUR; `"1000"` is 1000 JPY). It is validated against the currency's decimal places. Omit `container` to open a modal overlay.

Because the amount is set in the browser, use this flow for donations or pay-what-you-want. For fixed-price goods, create the payment intent on your server so the buyer cannot change the amount, then mount it.

### Server-created checkout

Create the intent on your server with a secret key, send the `reference` to the page, then mount it (no `paymentIntents.create` needed):

```ts
southpay.checkout.mount({
  reference: "REFERENCE_FROM_YOUR_SERVER",
  container: "#checkout",
  onCompleted: ({ successUrl }) => {
    if (successUrl) window.location.assign(successUrl);
  },
});
```

## API

### `SouthPay(publishableKey, options?): SouthpayClient`

- `publishableKey` (required): `sp_pk_live_...` or `sp_pk_test_...`.
- `options.apiBase` (optional, defaults to `https://api.southpay.io`)
- `options.checkoutOrigin` (optional, defaults to `https://pay.southpay.io`)
- `options.nonce` (optional): a CSP nonce. See [Content Security Policy](#content-security-policy).

Both URLs are validated; a non-http(s) value throws `invalid_config`.

### `client.paymentIntents.create(params): Promise<PaymentIntent>`

`amount` (decimal string, major units), `currency`, optional `orderId`, `title`, `description`, `imageUrl`, `successUrl`, `failedUrl`, `metadata`. Returns `{ reference }`.

The create request is idempotent. A key is generated per call, or pass your own `idempotencyKey` to make retries safe. It times out after 20s (`timeoutMs`) and accepts an `AbortSignal` via `signal`.

### `client.checkout.mount(options): CheckoutHandle`

`reference`, optional `container`, `minHeight`, and the callbacks below.

### `CheckoutHandle`

- `reference: string`
- `unmount(): void` removes the checkout and detaches its listeners.

### Callbacks

- `onReady()`
- `onStatusChange({ reference, status })` where `status` is a `CheckoutStatus`.
- `onCompleted({ reference, successUrl })`. If omitted, the SDK navigates to `successUrl` when it is a safe http(s) URL.
- `onFailed({ reference, status })`
- `onExpired({ reference })`
- `onError(error)` fired if the checkout widget fails to load.

### Errors

Methods throw `SouthpayError` with a `code`: `invalid_publishable_key`, `invalid_config`, `invalid_amount`, `missing_currency`, `missing_reference`, `container_not_found`, `network_error`, `timeout`, `request_failed`, `invalid_response`, `widget_load_failed`. Use `isSouthpayError(err)` to narrow safely across bundlers and realms.

### `VERSION`

The package version, also sent as `x-southpay-client` on the create request.

## Examples

- `examples/html` is a plain script-tag integration.
- `examples/react` is a React app that consumes the package.

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

With a nonce, the SDK injects a single nonce'd stylesheet and emits no inline styles (`style-src 'self' 'nonce-<your-csp-nonce>'`).

## Security

Only publishable keys reach the browser; the SDK rejects anything else. Inbound `postMessage` events are checked by both origin and source window, payloads are validated, and redirects are restricted to http(s) URLs. See [SECURITY.md](./SECURITY.md).

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run size
```

## License

MIT
