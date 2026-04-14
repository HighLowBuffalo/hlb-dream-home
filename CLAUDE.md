# HLB Home Vision Tool — Claude Code Project Instructions

## Project Overview

This is the **HLB Home Vision Tool** — a web application for High, Low, Buffalo Architecture (highlowbuffalo.co), a Denver-based architecture firm. The tool guides prospective clients through a structured home programming intake process before they begin working with the firm. Clients answer questions about their desired spaces (Part 1: The Program) and how they want their home to feel (Part 2: The Soul), then receive a formatted Programming Analysis document.

The finished application lives at `vision.highlowbuffalo.co` and will be linked from the firm's existing Squarespace website.

## Credentials

- Dashboard login credentials are stored in `.env.credentials` (gitignored)
- API keys and runtime secrets are stored in `.env.local` (gitignored)
- NEVER commit credentials to git or expose them in code

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript throughout — no exceptions |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (magic link / email OTP — no passwords) |
| File Storage | Supabase Storage |
| Styling | Tailwind CSS |
| Email | Resend |
| Deployment | Vercel |
| Word Export | `docx` npm package |
| Domain | vision.highlowbuffalo.co (subdomain of existing site) |

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
- Progress indicator: 5 small dots (5px circles), filled black when active
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

## Database Schema

Run these migrations in order. Never modify existing migrations — always add new ones.

See `supabase/migrations/001_core_tables.sql` and `supabase/migrations/002_rls_policies.sql`.

## File & Folder Structure

Maintain the structure defined in the project spec. Do not reorganize without a stated reason.

## Code Quality Rules

- **TypeScript strict mode** — no `any` types, no `@ts-ignore`
- **No `console.log` in production** — use proper error handling
- **Server components by default** — only add `'use client'` when you need browser APIs or state
- **No inline styles** — use Tailwind classes only
- **No hardcoded strings** in components — question text lives in `lib/data/`, not in JSX
- **All API routes** must validate auth before processing — never trust client-sent user IDs
- **Images** stored in Supabase Storage under path: `submissions/{submissionId}/{contextKey}/{filename}`
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle

## Brand Voice Reference

- **Warm but not precious** — direct, confident, a little informal
- **Never corporate** — avoid words like "utilize," "leverage," "streamline"
- **Honest about time** — "This will take about 30 minutes" not "Quick and easy!"
- **Specific** — "We'll send you a link" not "An email has been dispatched"
- **No exclamation points** in HLB UI copy

## Build Phases

Work through phases in order. Complete and verify each phase before starting the next.

1. **Phase 1 — Foundation**: Next.js setup, Supabase, Auth, Login/Verify, Middleware, Deploy skeleton
2. **Phase 2 — Core Survey**: Question data, Chat interface, Soul view, Autosave, Resume logic
3. **Phase 3 — Report Generation**: Space program table, Scope narrative, Report view
4. **Phase 4 — Word Doc Export**: .docx generation matching Depew format
5. **Phase 5 — Admin Dashboard**: Submission list, Detail view, Notes, Invite flow
6. **Phase 6 — Polish & Launch**: Email notifications, Mobile, A11y, Error/Loading states

## Contact

- **Client**: High, Low, Buffalo Architecture PLLC
- **Website**: highlowbuffalo.co
- **Email**: office@highlowbuffalo.co
- **Target subdomain**: vision.highlowbuffalo.co
