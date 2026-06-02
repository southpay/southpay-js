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

Bump the version in `package.json`, update `CHANGELOG.md`, then publish a GitHub release. The release workflow builds and publishes to npm with provenance.
