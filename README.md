# @southpay/js

Browser SDK for SouthPay crypto checkouts. No dependencies. Ships as ESM, CommonJS, and a global script.

## Install

```bash
npm install @southpay/js
```

Or load the hosted script:

```html
<script src="https://integrate.southpay.io/widgets/v2.js"></script>
```

The npm package exposes named exports; the hosted script exposes the same functions on `window.SouthPay`.

## Usage

You need a publishable key (`sp_pk_live_...` or `sp_pk_test_...`) from the dashboard. The SDK refuses any other key. Secret keys must never reach the browser.

### Browser-created checkout

```ts
import { init, createCheckout } from "@southpay/js";

init({ publishableKey: "sp_pk_live_..." });

await createCheckout({
  amount: 1000,
  currency: "EUR",
  container: "#checkout",
  onCompleted: ({ reference }) => console.log("paid", reference),
});
```

`amount` is in the minor unit of the currency (`1000` is 10.00 EUR). Omit `container` to open a modal overlay.

Because the amount is set in the browser, use this flow for donations or pay-what-you-want. For fixed-price goods, create the payment intent on your server so the buyer cannot change the amount, then mount it.

### Server-created checkout

Create the intent on your server with a secret key, send the `reference` to the page, then mount it. `mount` needs no key.

```ts
import { mount } from "@southpay/js";

mount({
  reference: "REFERENCE_FROM_YOUR_SERVER",
  container: "#checkout",
  onCompleted: ({ successUrl }) => {
    if (successUrl) window.location.assign(successUrl);
  },
});
```

## API

### `init(config)`

- `config.publishableKey` (required)
- `config.apiBase` (optional, defaults to `https://api.southpay.io`)
- `config.checkoutOrigin` (optional, defaults to the script origin or `https://pay.southpay.io`)

### `createCheckout(options): Promise<CheckoutHandle>`

`amount`, `currency`, optional `orderId`, `title`, `description`, `imageUrl`, `successUrl`, `failedUrl`, `metadata`, `container`, `minHeight`, and the callbacks below.

### `mount(options): CheckoutHandle`

`reference`, optional `container`, `minHeight`, and the callbacks below.

### `CheckoutHandle`

- `reference: string`
- `unmount(): void` removes the checkout and detaches its listeners.

### Callbacks

- `onReady()`
- `onStatusChange({ reference, status })`
- `onCompleted({ reference, successUrl })`
- `onFailed({ reference, status })`
- `onExpired({ reference })`

### Errors

`createCheckout`, `mount`, and `init` throw `SouthpayError` with a `code` (`not_initialized`, `invalid_publishable_key`, `invalid_amount`, `missing_currency`, `missing_reference`, `container_not_found`, `request_failed`, `invalid_response`).

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

## License

MIT
