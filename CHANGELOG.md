# Changelog

## 0.2.1

- The checkout iframe drops its min-height after the first resize, so it fits the checkout's actual content instead of holding the default floor.

## 0.2.0

Breaking: `init()` is gone. Create a client with `SouthPay(publishableKey, options)` and use `southpay.paymentIntents.create()` and `southpay.checkout.mount()`. The hosted script still exposes a `window.SouthPay` callable.

- `amount` is now a decimal string in major units (`"10.00"`, `"1000"` for JPY), validated per currency. Numbers are rejected at the type level.
- `checkoutOrigin` defaults to `https://pay.southpay.io`; `apiBase`/`checkoutOrigin` must be http(s) URLs.
- postMessage events are matched by `event.source`, payloads are validated, and redirects are limited to http(s) URLs. The iframe is sandboxed.
- Added `onError`, a `timeout` error code, the `CheckoutStatus` type, `isSouthpayError`, and `error.cause`.
- Modal: dialog semantics, Escape to close, scroll lock, focus restore.

## 0.1.0

Initial release.

- `init`, `createCheckout`, and `mount`.
- Inline and modal checkout embedding over the hosted checkout iframe.
- Publishable-key-only guard and origin-checked postMessage handling.
- Idempotent create requests with a configurable timeout and `AbortSignal`.
- `VERSION` export and an `x-southpay-client` request header.
- ESM, CommonJS, and global script builds with bundled type definitions.
