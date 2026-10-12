# Bizly

אפליקציית Web בעברית (RTL) לניהול הכנסות, הוצאות, מסמכים ומיסוי לעסק עצמאי בישראל.

## Tech stack

- Next.js (App Router), TypeScript, Tailwind, shadcn-style UI
- Supabase (PostgreSQL, Auth, Storage)
- Vercel (deployment target)

## Local setup

1. Clone [Nimrodsn/bizly](https://github.com/Nimrodsn/bizly.git)
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server only — migrations, admin delete, signed uploads)
   - `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` (optional)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
4. Apply database migration: paste [`supabase/migrations/20260201000000_initial_schema.sql`](supabase/migrations/20260201000000_initial_schema.sql) into Supabase SQL Editor (or use Supabase CLI linked to project `afsqjudkoxzlcvyewqgn`).
5. Enable **Google** provider in Supabase Auth and add redirect URL:
   - `http://localhost:3000/auth/callback`
   - Production URL after Vercel deploy
6. `npm run dev`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright smoke tests |

## Architecture

- **Business** — one per user in V1; unlimited **activities**
- **Tax** — values from `tax_configurations` per year (not hard-coded in UI)
- **AI** — server-side provider abstraction; tool-based data access
- **Documents** — private `business-documents` bucket; user-scoped paths
- **RLS** — all business data scoped by `auth.uid()`

## Deployment (Vercel)

Set the same environment variables in the Vercel project. Ensure Google OAuth redirect includes your production `/auth/callback` URL.

Never commit `.env.local` or secrets.

## Tax disclaimer

Calculations are informational tools only — not tax or legal advice. Verify with the Israel Tax Authority or a licensed professional.
