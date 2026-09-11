# Database scripts & migrations

## Tenant RLS (SCRUM-29)

1. In the Supabase SQL Editor, run [`migrations/20260911000000_tenant_rls.sql`](migrations/20260911000000_tenant_rls.sql).
2. Confirm schema + RLS: `npm run db:check` (reads `worker/.dev.vars`).
3. Cross-tenant isolation: `npm run db:rls-test`.
   - Optional Worker check: start `npm run dev:api`, then re-run; or set `API_BASE_URL`.

Worker API keeps using `SUPABASE_SERVICE_ROLE_KEY` with workspace membership filters; RLS protects direct anon/authenticated access to Postgres.
