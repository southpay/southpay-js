# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`@southpay/js` is the browser SDK for SouthPay crypto checkouts: a zero-dependency, side-effect-free package shipped as ESM, CommonJS, and a global script, with first-class types and a small bundle (size-limit budget: 4 kB gzip).

## Commands

```bash
npm run build            # tsup -> dist/ (ESM + CJS + IIFE global + .d.ts/.d.cts)
npm run dev              # tsup --watch
npm test                 # vitest run (happy-dom)
npm run test:watch       # vitest watch
npx vitest run test/money.test.ts        # single file
npx vitest run -t "normalizeAmount"      # single test by name
npm run typecheck        # tsc --noEmit (covers src + test only, NOT e2e/examples)
npm run lint             # biome check .
npm run format           # biome format --write .
npm run size             # size-limit (gzip budget per bundle)
npm run check:exports    # publint --strict && attw --pack
npm run test:e2e         # build + playwright (run `npx playwright install` first)
npm run preflight        # full gate: lint, typecheck, test, build, check:exports, size
```

`check:exports` runs `npm pack` internally, so it cannot live inside `prepublishOnly` (you can't nest `npm pack` in `npm publish`). Run it via `preflight` or CI instead.

## Architecture

**Client factory, no global state.** `SouthPay(publishableKey, options)` (`src/client.ts`) resolves config once via `resolveConfig` (`src/config.ts`) and returns `{ publishableKey, paymentIntents, checkout }`. Multiple clients (test + live) can coexist; there is no module-level singleton. The publishable key must match `sp_pk_(live|test)_...`; secret keys are rejected.

**Two-step flow.** `paymentIntents.create(params)` (network, `src/api.ts`) POSTs to `/api/v2/payments` and returns `{ reference }`. `checkout.mount(options)` (`src/embed.ts`) renders the hosted checkout. Browser-created checkout = create then mount; server-created = mount a server's reference directly (no key needed beyond the client).

**Amounts are decimal strings in major units** (`"10.00"`, `"1000"` for JPY), validated and canonicalized per ISO-4217 exponent in `src/internal/money.ts` using all-string math (no float). A `number` is a type error. The wire format sent to the API is the canonicalized decimal string.

**Embedding and messaging.** `mountCheckout` builds the iframe (`src/internal/iframe.ts`), appends it to a container or opens a focus-managed modal, and listens on `window` for `message` events. Inbound events are accepted only when `event.origin === checkoutOrigin && event.source === iframe.contentWindow`, then validated/narrowed by `parseEmbedMessage` (`src/internal/messaging.ts`) before `dispatch` maps them to callbacks. When `onCompleted` is absent, the SDK navigates to `successUrl` only if `isSafeRedirectUrl` passes (http/https only; `src/internal/url.ts`).

**Dual styling modes** (`src/internal/styles.ts`). By default styles are applied inline. If a CSP `nonce` is passed to `SouthPay()`, the SDK injects a single nonce'd `<style>` and drives per-frame height through CSSOM rule mutation, emitting zero inline styles so it works under a strict `style-src`. `createIframe`/`createModal` branch on the resulting `usesClasses` flag.

**Errors.** Throw `SouthpayError` (`src/errors.ts`) with a specific `code` from the union, never a bare `Error`. `isSouthpayError` is realm-safe (checks `name` + `code`, not just `instanceof`).

**Build.** `tsup.config.ts` has two configs: (1) `src/index.ts` -> ESM + CJS + types; (2) `src/global.ts` -> IIFE whose single default export esbuild returns directly as `window.SouthPay` (with `SouthpayError`/`isSouthpayError`/`VERSION` attached). `__SDK_VERSION__` is injected from `package.json` into `src/version.ts`.

## External contracts

Two wire contracts cross the package boundary and are pinned in `test/contract.test.ts` as the canonical reference:

- **Inbound** (checkout iframe -> SDK): `{ source: "southpay:checkout", event, ... }` for `ready`/`resize`/`status`/`completed`/`failed`/`expired`, with `success_url` (snake) and statuses in the `CheckoutStatus` union.
- **Outbound** (SDK -> API): the `payment_intent` request body field names (`amount`, `order_id`, `image_url`, `success_url`, ...) and the `{ reference }` / `{ data: { reference } }` response.

If the deployed checkout or API schema changes, update `test/contract.test.ts` to match. The runtime export surface is locked by `test/public-api.test.ts`.

## Conventions

- No code comments (functional directives like `biome-ignore` are out too; the source currently has none). No em-dashes or other AI-prose tells in code, docs, or commits.
- Keep zero runtime dependencies and `sideEffects: false`; new code must stay within the size budget.
- Public API changes need updated types, tests, and a CHANGELOG entry; the API is meant to be backwards-compatible long term.
- In tests, happy-dom returns `null` for every `iframe.contentWindow`, so the source-binding tests stub distinct window objects to exercise the `event.source` check.

## Releasing

Bump the version in `package.json`, update `CHANGELOG.md`, and publish a GitHub release; CI (`.github/workflows/release.yml`) runs `npm publish --provenance`. For the first publish, run `npm run preflight` then `npm publish`.
