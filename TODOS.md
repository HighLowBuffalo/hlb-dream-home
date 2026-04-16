# TODOS — Deferred Work

Work that has been considered and scoped but not built. Each item has the reasoning captured so whoever picks it up (future you, another dev, another Claude session) understands the motivation, current state, and where to start.

---

## 1. Playwright E2E harness

**What:** Install Playwright. Write specs that drive real browser sessions through magic-link flow (via `/api/dev/impersonate`), survey completion, image upload, sign-out.

**Why:** Automated regression detection before prod. Currently every change gates on either manual verification through `/api/dev/impersonate` + preview tools, or a user-reported bug after Vercel deploys.

**Pros:**
- Runs in CI (GitHub Actions), catches regressions without human involvement.
- Real browser catches hydration, CSS, and rendering bugs that unit tests miss.
- Living documentation of expected user flows.

**Cons:**
- ~200 MB install footprint (Chromium + deps).
- Slow per run (30-90s for a small suite).
- Config overhead: playwright.config.ts, test fixtures, CI integration.
- Need storage-state management: log in once via `/api/dev/impersonate`, save session cookies, reuse across tests.

**Context:**
- App is Next.js App Router on Vercel with Supabase auth.
- Impersonation endpoint (`app/api/dev/impersonate/route.ts`) is the fast-auth hook Playwright would call.
- Suggested file layout: `tests/e2e/*.spec.ts`, add `test:e2e` npm script, set up `playwright.config.ts` to reuse the dev server on port 3003.
- First specs worth writing: `admin-dashboard.spec.ts` (loads list, clicks a submission, sees flags/images), `client-survey.spec.ts` (starts survey, answers 3 questions, flags one, refreshes, verifies persistence), `sign-out.spec.ts` (click → land on /login).

**Depends on / blocked by:** Nothing. `/api/dev/impersonate` already exists.

**Triggers to pick this up:**
- Second developer joins.
- A regression ships to prod that would have been caught by a real browser test.
- Change frequency exceeds what the manual verification loop can sustain.

---

## 2. Demo-data seed script

**What:** Node script (`scripts/seed-demo.ts` or `.mjs`) that inserts a fully-populated demo submission — program answers across every section, soul answers, flags, and uploaded image metadata — under either an admin or a dedicated `demo@` user.

**Why:** Currently testing depends on whatever real submissions happen to exist in the DB. Running locally against a fresh Supabase project (or after a data wipe) leaves the admin dashboard empty. A seed script makes test setup deterministic and gives demo-able data at any moment.

**Pros:**
- Reproducible test environment — every developer sees the same demo submission.
- Useful for screenshotting / demoing progress to Adam.
- Lets us test report-rendering edge cases (long answers, unicode, missing sections) deterministically.
- Bug reports can reference "demo submission #1" without ambiguity.

**Cons:**
- Requires curated realistic content — not just lorem ipsum.
- Maintenance burden when schema evolves (new question keys, new tables).
- Risk of polluting prod DB if run against the wrong env (must gate on env check).

**Context:**
- Would use `createAdminClient()` from `lib/supabase/admin.ts` (service role, bypasses RLS).
- Would probably insert under the existing `tim.buttrill@gmail.com` admin user, or create a dedicated `demo@highlowbuffalo.co` to keep demo data out of the real admin's submission list.
- Image uploads require actual bytes in Supabase Storage `uploads` bucket — the script would need to either upload fixture images or use pre-known paths.
- Script must be idempotent (re-running doesn't duplicate data) and env-safe (refuse to run against the prod Supabase project unless explicitly confirmed).

**Depends on / blocked by:** Nothing technically. Mostly needs content curation.

**Triggers to pick this up:**
- We need to demo the tool to Adam or a prospective client on a clean DB.
- An E2E test suite is added (Playwright tests need deterministic data).
- A fresh Supabase project is spun up (staging environment).

---

## 3. Custom subdomain deployment

**What:** Point `program.highlowbuffalo.co` at the Vercel deployment via Porkbun DNS + Vercel custom domain.

**Why:** Item 3c on the original feature list. Prod URL today is `hlb-dream-home-umber.vercel.app`; the client-facing URL should be on the HLB domain.

**Pros:**
- Matches the branding Adam expects.
- More professional-looking in magic-link emails and client-facing communications.

**Cons:**
- Requires DNS access (Porkbun) plus Vercel domain config.
- One-time Supabase auth URL update so magic links redirect to the new subdomain.

**Context:**
- Domain registrar: Porkbun (highlowbuffalo.co).
- Add `program` CNAME pointing to `cname.vercel-dns.com`.
- In Vercel project settings → Domains, add `program.highlowbuffalo.co`.
- In Supabase Auth → URL Configuration, update Site URL and redirect allowlist to include the new subdomain.

**Depends on / blocked by:** Access to Porkbun DNS settings.

---

## Notes on maintenance

When an item on this list is started or finished, update the corresponding row — don't just delete it. A finished item becomes a one-line summary + link to the commit that resolved it.
