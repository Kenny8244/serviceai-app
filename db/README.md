# Database scripts & migrations

## Demo multi-vertical seed (SCRUM-30)

Repeatable development data for local testing (not production UI fixtures).

1. Ensure core schema is applied (`migrations/20240207000000_complete_setup.sql` and follow-ons as needed).
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `worker/.dev.vars`.
3. Run:

```bash
npm run db:seed
```

What it creates (idempotent — safe to re-run):

- Auth user / profile: `demo@simpleserviceai.com` / `demo123`
- Tenant **Demo Company**
- **Four workspaces** (demo user as owner), tagged with `metadata.verticalId`:
  - `retail` → Demo Retail
  - `restaurant` → Demo Restaurant
  - `store-market` → Demo Marketplace
  - `business` → Demo Enterprise
- Per workspace: object types + themed sample assets (`custom_fields.source = "scrum-30-seed"`)
- Per workspace: sample Postgres `service_requests` (SCRUM-43 columns: title, category, related_asset_object_id)

**How to try it:** Try Demo → pick a vertical → active workspace switches to that vertical’s seed → Assets shows the matching inventory.

**Service requests in the app UI:** `/api/service-requests` still uses Worker `DEMO_KV`. On **Try Demo**, the Worker ensures sample requests for each vertical in KV. Postgres rows from `db:seed` are for DB/dev inspection and future migration.

Verify:

1. `npm run db:seed` (twice — second run should skip duplicates).
2. `npm run dev` → Try Demo → choose Restaurant → Assets shows kitchen samples.
3. Choose Retail (re-enter vertical flow or select again) → Assets shows retail samples.
4. Service requests API/UI shows samples after demo login.

## Tenant RLS (SCRUM-29)

1. In the Supabase SQL Editor, run [`migrations/20260911000000_tenant_rls.sql`](migrations/20260911000000_tenant_rls.sql).
2. Confirm schema + RLS: `npm run db:check` (reads `worker/.dev.vars`).
3. Cross-tenant isolation: `npm run db:rls-test`.
   - Optional Worker check: start `npm run dev:api`, then re-run; or set `API_BASE_URL`.

Worker API keeps using `SUPABASE_SERVICE_ROLE_KEY` with workspace membership filters; RLS protects direct anon/authenticated access to Postgres.

## Service request model (SCRUM-43)

1. Apply [`migrations/20260914160000_scrum43_service_request_model.sql`](migrations/20260914160000_scrum43_service_request_model.sql) in the Supabase SQL Editor (after core setup; RLS can already be on).
2. Confirm AC columns: `npm run db:check`.
3. Re-seed if needed: `npm run db:seed` (writes `title`, `category`, `related_asset_object_id`).
