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

## 3. Eval CI integration

**What:** Run `evals/survey-prompt.test.mjs` on every PR via GitHub Actions; post results as a PR comment.

**Why:** Regression protection for prompt behavior without relying on manual discipline. Today's eval harness is run by hand before pushes; CI enforces it across contributors and across time.

**Pros:**
- Catches prompt regressions on every change, not just when someone remembers to run evals.
- Forces awareness of eval failures instead of letting them accumulate.
- Scales naturally if/when a second dev joins.

**Cons:**
- ~$0.10 per PR in Haiku API cost.
- Secret management for `ANTHROPIC_API_KEY` in GitHub Actions.
- Stochastic LLM outputs create occasional flakes; need `continue-on-error: true` initially so PRs aren't blocked by noise.

**Context:**
- Harness is a standalone Node script at `evals/survey-prompt.test.mjs` (shipped in the BIG CHANGE survey PR).
- Workflow file: `.github/workflows/evals.yml` with `on: pull_request`.
- Should post eval summary + failure diffs as a PR comment via the `actions/github-script` action.

**Depends on / blocked by:** Eval harness shipping (it does, in the survey PR).

**Triggers to pick this up:**
- A second dev joins.
- Prompt regressions slip through despite manual runs.
- Real users start depending on the conversational behavior.

---

## 4. Capture real transcripts as eval fixtures

**What:** Save anonymized real user conversations under `evals/fixtures/`. Each fixture becomes a regression test — "this conversation once worked well, make sure it still does."

**Why:** Synthetic eval cases test individual rules in isolation. Real conversations catch combined behaviors (probing cadence × tradeoff-sharpening × scope). The PDF feedback that drove the Big Change PR is itself an example: a real transcript exposed bugs that synthetic cases wouldn't have caught.

**Pros:**
- High-value regression coverage grown organically as users test.
- Makes evals increasingly realistic over time — each fixture is grounded in actual user behavior.
- Doubles as documentation of "what good conversation looks like."

**Cons:**
- Requires chat history persistence (currently NOT stored — see TODO 5).
- Manual curation to pick representative conversations.
- PII scrubbing required before committing fixtures to git.

**Context:**
- Would add `scripts/capture-transcript.mjs` reading from the new `chat_messages` table (TODO 5) and emitting a JSON fixture.
- Eval harness would glob fixtures and run each as its own case.
- PII scrub: names, addresses, specific identifiers. Consider a regex-based scrubber in the capture script.

**Depends on / blocked by:** TODO 5 (chat message persistence) must land first.

**Triggers to pick this up:**
- Chat message persistence is in.
- Multiple real users have tested and produced interesting conversation shapes.

---

## 5. Persist raw chat messages

**What:** Add a `chat_messages` table to Supabase and save every user + LLM message (in addition to the existing extracted `<answer>` payloads). Expose the full conversation in the admin submission detail view.

**Why:** Adam currently sees only the structured extractions. The actual conversation carries nuance (how the client phrased tradeoffs, what they elaborated on, where they hesitated) that the extracted fields lose. Also unlocks TODO 4 (transcript fixtures for evals).

**Pros:**
- Richer context for architects reviewing submissions — tone, hesitation, elaborations.
- Post-hoc prompt debugging when users report odd behavior — we can see exactly what was said.
- Groundwork for real-transcript eval fixtures (TODO 4).
- Enables resume UX where the client can see their own prior conversation, not just their extracted answers.

**Cons:**
- New table + RLS policy (user reads own messages, admin reads all).
- Storage grows faster — long Soul answers can be 500+ words each.
- Modest additional save work per turn (one insert per message pair).
- One more thing to migrate when schema evolves.

**Context:**
- Schema: `chat_messages(id UUID, submission_id UUID → submissions, role TEXT CHECK IN ('user','assistant'), content TEXT, created_at TIMESTAMPTZ)`.
- RLS mirrors `program_answers`: users manage own, admins read all.
- Save site: in `/api/chat` route, after extracting `<answer>` tags, insert both the user message and the assistant response.
- Admin UI: a collapsible "Full conversation" section in `/submission/[id]`.
- Consider retention — do we keep forever or prune after N days?

**Depends on / blocked by:** Nothing; independent.

**Triggers to pick this up:**
- Adam reports wanting to see the actual conversation.
- TODO 4 becomes desirable.
- A behavior bug surfaces that requires conversation replay to diagnose.

---

## 6. Custom subdomain deployment

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
