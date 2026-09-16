# Voltura Projects

A public gallery of original public GitHub repositories owned by voltura.

## Experience
Search names, descriptions, languages, and topics. Sort by last push, name, stars, or creation date. Project cards use verified repository artwork and link to GitHub, product websites, YouTube, and Pinterest when present.

## Catalog refresh
The initial verified catalog lives in data/catalog.json. The first server read seeds the Sites-managed D1 cache. Once the last complete refresh is six hours old, a visit starts a full paginated public listing. Only a successful full listing removes entries. Changed projects are enriched in resumable, single-repository batches. A database lease prevents concurrent refreshes. Failed batches keep their prior content and retry after fifteen minutes or GitHub's rate-limit reset, whichever is later.

The browser checks the read-only /api/catalog endpoint every five seconds during refresh and every five minutes otherwise. No work runs without visits. No GitHub token, visitor account, cron job, or external database is required.

## Development
Use the Sites building and hosting skills for installation, preview, builds, and publication. D1 binding: DB. Schema: db/schema.ts. Apply pending generated migrations to the local preview database before testing the catalog.

Run `node --test tests/catalog.test.mjs` for parser, sorting, pagination, persistence, locking, and recovery tests. Run `node node_modules/typescript/bin/tsc --noEmit` for type checks.

Regenerate the initial catalog with `node scripts/seed-catalog.mjs` before creating a new deployment seed. Never edit an already-applied migration; generate a new one for schema changes.
