# Needs Your Hands

Steps in the integration work that I **cannot** do from the code side — they require credentials, hosted-service access, or running infrastructure. Grouped by phase. Nothing here touches the excluded credential documents; these are actions you take in your own environment.

Last updated: 2026-06-14 (after Phase 1 code).

---

## Phase 1 — Bring the AthleteOS hub online

All Phase 1 **code** is written and typechecks clean in isolation. To make it live and let us verify end-to-end, in `AthleteOS/.../project/server`:

1. **Environment variables** (in `server/.env`):
   - `DATABASE_URL` — Supabase Postgres connection string (Project Settings → Database → Connection string). Needed to apply migrations.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — runtime DB access.
   - `JWT_SECRET` — existing user auth.
   - `SERVICE_KEY_SALT` — **new**; any long random string. Service keys are hashed with it, so it must stay stable once set.
2. **Apply the new migration**: `npm run db:migrate` (applies `supabase/migrations/0002_sync_and_registry.sql` — creates `service_clients`, `canonical_athletes`, `athlete_links`, `sync_envelopes`, and the projection tables). The migration is idempotent.
3. **Create a service key per spoke app** that will talk to the hub, e.g.:
   - `npm run db:create-service-client swimStatePro "Swim State Pro"`
   - `npm run db:create-service-client olbrechtSystem "Olbrecht Tracker"`
   - `npm run db:create-service-client formLab "FormLab"`
   Each prints a raw key **once** — store it securely; it's what that app sends in the `x-service-key` header. (Only the hash is stored in the DB.)
4. **Run the hub**: `npm run dev` (uses `tsx`, which runs fine despite the pre-existing type errors below).
5. **Smoke test** — scripted and ready at `server/scripts/smoke-sync.mjs`. Create two keys (a `swimStatePro` producer + an `olbrechtSystem` consumer), then from `server/`:
   ```
   BASE_URL=http://localhost:3001 PRODUCER_KEY=<swimStatePro key> CONSUMER_KEY=<olbrechtSystem key> node scripts/smoke-sync.mjs
   ```
   It checks: health, auth rejection, athlete minting, push, idempotent re-push, conflict detection, cross-app push guard, consumer pull, and producer self-exclusion. Prints `ALL CHECKS PASSED ✅` or the failures. Paste me the output (keys stay on your side) and I'll flip the 4 `aos-*` milestones to `done` and start Phase 2 — or share the two keys and I'll run it for you.

> **Known pre-existing issue (not mine, not blocking dev-mode):** the AthleteOS server has **50 pre-existing TypeScript errors** (in `userService`, `fileUploadService`, `notificationService`, `authService`, `jobs`, `users`, `queueService`) from the half-migrated raw-SQL `query()` stub and jwt typing. It runs under `tsx`/`nodemon` (transpile-only) but **does not `npm run build`**. This is the `aos-server-stabilization` milestone and is independent of the integration work. Say the word and I'll take it on as a focused task.

---

## Standing items (all phases)

- **Supabase projects**: each app (AthleteOS, Swim State Pro, Olbrecht, FormLab) has its own Supabase project. Applying migrations and setting env keys is yours; I write the SQL and code.
- **Credential documents** remain off-limits to me by policy (the two Supabase password docs). If a step needs a stored password, that step is yours.
- **Deploys / hosting** (Vercel, Netlify, etc.): I prepare configs and env templates; you hold the accounts.

## How we'll use this doc

As each phase produces code, I'll add its manual steps here. When you complete a batch, tell me and I'll run the verification (or script it for you) and flip the affected milestones from `in_progress` to `done` in the tracker.
