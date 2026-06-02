# Contributing

## Setup

```bash
npm install
```

## Checks

Run these before opening a pull request. CI runs the same set.

```bash
npm run lint        # Biome
npm run typecheck   # tsc --noEmit
npm test            # Vitest
npm run build       # tsup (ESM, CJS, IIFE, types)
npm run size        # bundle size budget
```

## Conventions

- No runtime dependencies. Keep the bundle small; `npm run size` enforces a budget.
- Public API changes need types, tests, and a CHANGELOG entry.
- Formatting and linting are Biome. Run `npm run format` to apply fixes.
- Throw `SouthpayError` with a specific `code` rather than a bare `Error`.

## Releasing

Bump the version in `package.json`, update `CHANGELOG.md`, and publish a GitHub release. CI then publishes to npm with provenance and deploys the hosted script (`npm run cdn:deploy`) to `integrate.southpay.io`. Required repo secrets: `NPM_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

For the first publish, run `npm run preflight`, then `npm publish`. The CDN can be deployed manually with `npm run cdn:deploy`. When bumping the version, update the pinned `southpay-js-<version>.js` URL and its SRI in `README.md` (the hash is printed by `npm run cdn:stage`).
