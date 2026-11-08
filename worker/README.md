# Bezeqta shared scores

Frontend stays at https://18noamphotos-blip.github.io/bezeqta/ .
API: https://bezeqta-scores.bezeqta-noamisback.workers.dev/marks
Source UI imported from bezeqta1 commit 0f115aa3844697f542026b62ef879c4baa3c7309.

Workers Free + D1; never enable a paid plan or attach a payment method automatically.
D1 database `bezeqta-scores`, ID `a99dc9c2-2cd3-4abb-9600-76f60de1375f`.
These addresses and binding IDs are public identifiers, not credentials.

## Data contract

GET /marks returns `{version, marks: [{matchId, played, score}]}`.
POST /marks accepts one `{matchId, played, score}` and returns a snapshot.
D1 batch atomically writes the result, increments a board revision and reads the
snapshot. SQLite boolean values are converted to JSON booleans. Only match IDs
1–12 and score strings of at most 8 numeric/separator characters are accepted.
No pg, in-memory PGlite, browser database key or browser auth secret is used.

Editing is deliberately public; CORS is NOT authentication. Any API client can
edit results. CORS permits the GitHub origin, not only this project path.
Concurrent users have last-accepted-write-wins semantics, not collaborative
conflict-free merging. This tab serializes writes; pending edits and monotonic
snapshot revisions prevent stale HTTP responses from clobbering newer local state.

Initial state was explicitly chosen CLEAN: 12 unplayed matches with blank scores.
`schema.sql` inserts missing rows only; rerunning it never resets existing scores.
The UI never loads or uploads legacy `bezeq_tennis_2026_27` cached scores.
Home-court preference remains device-local. Old local scores are not deleted;
shared response caching uses the separate `bezeq_tennis_shared_v1` key.
No reset-all control, matching the updated export. Failed edits retry, including
when a subsequent successful visible-tab poll detects connectivity recovery.

## Reproduce and update

Test with Node 24: `npm ci && npm run test:pages && npm run build:pages`.
Worker SQL tests use node:sqlite and an adapter for D1 batch semantics; local
Wrangler/workerd + D1 was also exercised through HTTP (not browser automation).

Use official Wrangler 4.158.0 with an explicitly approved login/account.
No credentials belong in this repository. For example:

```
npx wrangler@4.158.0 d1 execute DB --config worker/wrangler.jsonc --local --file worker/schema.sql
npx wrangler@4.158.0 dev --config worker/wrangler.jsonc --local
npx wrangler@4.158.0 deploy --config worker/wrangler.jsonc --dry-run
npx wrangler@4.158.0 deploy --config worker/wrangler.jsonc
```

Remote schema setup (only when intentionally needed):
`npx wrangler@4.158.0 d1 execute DB --config worker/wrangler.jsonc --remote --file worker/schema.sql`.

Pushes to main automatically deploy the frontend through the existing Pages
workflow. Backend deployment is MANUAL through approved Wrangler authorization;
no new GitHub secrets or backend auto-deploy permissions were added.
Keep the public API address in pages/marks-api.ts aligned if changing the Worker.

## Free-plan limits

Workers: 100,000 requests/day/account. D1: 5 million rows read/day,
100,000 written/day; account limits are shared. A visible tab polls every 6s
(~600 requests/hour, plus writes, startup, retries and OPTIONS). Each GET reads
12 match rows plus one revision row. At quota exhaustion synchronization can
fail; the static frontend remains available. No paid upgrade is automatic.
