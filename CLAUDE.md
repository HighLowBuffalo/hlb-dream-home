# HLB DreamHome — Project Instructions

## Project Overview

HLB DreamHome is a custom client onboarding and programming questionnaire tool for High Low Buffalo (HLB), a residential architecture practice run by Adam Wagoner in Denver, CO. The tool replaces a manual intake process with an interactive, AI-assisted survey that prospective homebuilding clients complete before their first design meeting.

Clients receive a magic link via email, answer questions about their dream home (rooms, style, budget, lifestyle, site, inspiration images), and the tool saves their responses to a database. Adam and his team log in as superusers to review all client submissions in a formatted admin dashboard.

The tool lives at: `program.highlowbuffalo.co`

## Credentials

- Dashboard login credentials are stored in `.env.credentials` (gitignored)
- API keys and runtime secrets are stored in `.env.local` (gitignored)
- NEVER commit credentials to git or expose them in code

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript throughout — no exceptions |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (magic link / email OTP — no passwords) |
| File Storage | Supabase Storage |
| AI Model | Anthropic Claude API (conversational questionnaire flow) |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Word Export | `docx` npm package |
| Domain | program.highlowbuffalo.co (subdomain via Porkbun) |
| Domain Registrar | Porkbun (highlowbuffalo.co) |

## Architecture

Two user roles, one codebase:

1. **Client (default):** Receives a magic link, completes the questionnaire, can return later to see or continue their responses. No passwords.
2. **Superuser (admin):** Specific email addresses manually added to Supabase. Logs in via the same magic link flow but sees an admin dashboard with all client submissions.

All data persists in Supabase. The client-facing side auto-saves after every question so nothing is lost if the user closes the tab or loses connection.

## Design System

The visual design must match the existing HLB prototype exactly. This is non-negotiable — the client has approved this aesthetic.

### Colors
```css
--black: #0a0a0a;
--white: #ffffff;
--gray-100: #f5f5f3;
--gray-200: #e8e8e4;
--gray-400: #9a9a94;
--gray-600: #5a5a56;
```

### Typography
- **Font**: DM Sans (Google Fonts) — weights 300, 400, 500
- **No other fonts** — do not introduce serif fonts, system fonts, or any other typeface
- Body text: 15px, weight 300, line-height 1.6–1.75
- Labels/eyebrows: 10–11px, weight 500, letter-spacing 0.12–0.18em, ALL CAPS
- Question text: 20–22px, weight 300

### UI Rules
- **Black and white only** — no color accents, no gradients, no shadows
- Buttons: black filled (`bg-black text-white`) or outline (`border border-gray-200`)
- All button text: uppercase, letter-spacing 0.06–0.1em, font-weight 500
- Inputs: bottom-border only (no box border) for single-line; full border for textarea
- Border radius: 0 everywhere — no rounded corners on anything
- Chips/tags: `border border-gray-200`, uppercase, 11–12px
- Progress indicator: persistent and always visible — users should always know where they are
- No emojis, no icons except the upload SVG arrow

### Component Patterns
```tsx
// Correct button pattern
<button className="bg-black text-white px-8 py-3 text-xs font-medium tracking-widest uppercase hover:opacity-80 transition-opacity">
  Continue →
</button>

// Correct outline button
<button className="border border-gray-200 text-black px-6 py-3 text-xs font-medium tracking-widest uppercase hover:border-black transition-colors">
  Back
</button>

// Correct input (single line)
<input className="w-full border-0 border-b border-gray-200 pb-3 pt-3 text-sm font-light focus:border-black focus:outline-none transition-colors placeholder:text-gray-400" />

// Correct textarea
<textarea className="w-full border border-gray-200 p-3 text-sm font-light focus:border-black focus:outline-none resize-none transition-colors placeholder:text-gray-400 placeholder:italic" />
```

### Brand Voice
- **Warm but not precious** — direct, confident, a little informal
- **Never corporate** — avoid words like "utilize," "leverage," "streamline"
- **Honest about time** — "This will take about 30 minutes" not "Quick and easy!"
- **Specific** — "We'll send you a link" not "An email has been dispatched"
- **No exclamation points** in HLB UI copy

### Design Direction
Clean, warm, residential architecture aesthetic. Not a SaaS startup look. Think: calm, confident, approachable. Reference highlowbuffalo.co for color palette and typography cues. The tool should feel like an extension of Adam's practice, not a generic survey tool.

## Database Schema

Run these migrations in order. Never modify existing migrations — always add new ones.

See `supabase/migrations/001_core_tables.sql` and `supabase/migrations/002_rls_policies.sql`.

## Feature & Fix List (Priority Order)

### 1. Critical Fixes

**1a. Fix the submit button.**
The final submit button does not work. Highest priority blocker.

**1b. Supabase magic link auth.**
Users enter email, receive magic link, click it to log in and reach their survey (new or in-progress). No passwords. Returning users pick up exactly where they left off.

**1c. Continuous auto-save.**
Every answer saved to Supabase as the user completes it. Tab close, power loss, device switch — everything preserved. Return via magic link, all previous answers pre-populated.

**1d. Connect the Anthropic API.**
Wire Claude API so the model powers the conversational flow. The model should respond to user answers, ask follow-ups, and make the experience feel like a conversation with an architect, not a form.

### 2. Survey UX Improvements

**2a. Conversational, not robotic.** LM responds to answers, asks follow-ups, gives option to elaborate or move on.
**2b. Progress bar: persistent and visible.** Always visible, survives scrolling and page transitions.
**2c. Allow skipping questions.** Nothing blocks forward progress.
**2d. Add "Other" / free-text option.** Multi-choice questions need an "Other" that opens a text input.
**2e. Half-bath (0.5) support.** Allow 0.5 increments or a separate "powder rooms" field.
**2f. "Come back to this" bookmark button.** Flag items to revisit before submitting.
**2g. Scroll/scaling behavior.** Auto-scroll smoothly to each new question.
**2h. Consistent question format.** Smooth transition between structured and long-form sections.

### 3. Features to Build

**3a. Superuser admin dashboard.** Admin view showing all client submissions with click-through to formatted results.
**3b. Image/reference upload.** Uploads stored in Supabase Storage, visible in client review and admin dashboard.
**3c. Custom subdomain deployment.** Deploy to `program.highlowbuffalo.co` (Vercel + Porkbun DNS).

### 4. Future Backlog (Do Not Build Yet)

- **Voice survey mode:** Let users complete the survey by speaking into a mic instead of typing. Use Web Speech API or Whisper for transcription, stream audio to text, feed into the same Claude conversation flow. Requires mic permission UI, real-time transcription display, and fallback to text input.
- **Style photo picker:** Present users with a curated grid of pre-selected interior and exterior photos representing different architectural styles (modern, craftsman, farmhouse, industrial, etc.). Users select photos they're drawn to and optionally explain why. Answers feed into the programming analysis. Requires: photo curation, Supabase Storage for images, a new survey section between Program and Soul.
- **Mood board / Pinterest import:** Allow users to paste a Pinterest board URL or upload screenshots from mood boards. Parse or display the linked content alongside their survey responses. Visible in both client review and admin dashboard.
- Spouse/partner mode (two people, same project, results compared)
- AI-generated mood images

## Development Guidelines

- **Test before deploying.** Use the local dev server (port 3003) with browser preview tools to verify features work before committing. Also use direct API calls (curl / fetch) to test backend routes. Do not deploy untested code.
- **One feature at a time.** Work on a single feature or fix, test it, commit, then move to the next.
- **Commit frequently to GitHub.** Every meaningful change committed and pushed.
- **Port assignment:** Use port 3003 for local dev (`next dev -p 3003`).
- **Environment variables:** Supabase URL, Supabase anon key, and Anthropic API key in `.env.local` and Vercel settings. Never expose API keys in client-side code.
- **Auto-save pattern:** Supabase upserts keyed to user's auth ID. Save after each question. Debounce 500ms.
- **Magic link flow:** `supabase.auth.signInWithOtp({ email })`. On return, check for existing session and load saved responses.
- **Superuser check:** On login, query whether user's email exists in superuser list. If yes → admin dashboard. If no → client survey.

## Code Quality Rules

- **TypeScript strict mode** — no `any` types, no `@ts-ignore`
- **No `console.log` in production** — use proper error handling
- **Server components by default** — only add `'use client'` when you need browser APIs or state
- **No inline styles** — use Tailwind classes only
- **No hardcoded strings** in components — question text lives in `lib/data/`, not in JSX
- **All API routes** must validate auth before processing — never trust client-sent user IDs
- **Images** stored in Supabase Storage under path: `submissions/{submissionId}/{contextKey}/{filename}`
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle

## Key Contacts

- **Adam Wagoner** — HLB principal, project owner
- **Tim Buttrill** — Tandem Bike Partners, fractional COO / technical lead
- **Email**: office@highlowbuffalo.co

## Related Projects (Same Stack)

- **Gas Riser Diagram App** — gasriser.dakecollaborative.com
- **Scans and Plans** — scansandplans.com

Patterns, auth flows, and deployment processes from these projects can be referenced as proven templates.
