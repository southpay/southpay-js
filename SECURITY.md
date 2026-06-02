# Security policy

## Reporting a vulnerability

Email security@southpay.io with a description and reproduction steps. Do not open public issues for security reports. We aim to acknowledge within two business days.

## Scope

This package runs in the browser and only ever uses publishable keys (`sp_pk_...`). It never accepts a secret key. If you find a way to make the SDK send privileged credentials, accept a non-publishable key, or post to an unintended origin, treat it as in scope.

## Handling of keys and origins

- `init` rejects any value that is not a publishable key.
- The SDK only talks to the configured `apiBase` and renders the configured `checkoutOrigin`.
- Inbound `postMessage` events are ignored unless their origin matches `checkoutOrigin`.
