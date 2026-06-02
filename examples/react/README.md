# @southpay/js React example

A React + TypeScript app that consumes `@southpay/js`. It imports the SDK by package name; locally it resolves to `../../src` through a Vite alias, so you do not need to publish or build the SDK first.

```bash
npm install
cp .env.example .env
# set VITE_SOUTHPAY_PUBLISHABLE_KEY to an sp_pk_test_... key
npm run dev
```

- `src/SouthpayCheckout.tsx` mounts a checkout into a `div` and unmounts it on cleanup. It accepts either `{ amount, currency }` (browser-created) or `{ reference }` (server-created).
- `src/App.tsx` calls `init` once and renders both flows.
