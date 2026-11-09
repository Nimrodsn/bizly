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
   - `SUPABASE_SECRET_KEY` (optional server-only admin features; not needed for receipts)
   - `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` (optional)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
4. Apply every SQL file in `supabase/migrations/`, in filename order, once per database. The existing deployment has all three migrations applied.
5. Enable the **Email** provider in Supabase Auth and create a confirmed email/password user in the Supabase dashboard. The app has no public signup form.
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

Set the two `NEXT_PUBLIC_SUPABASE_*` variables in the Vercel project. Email/password auth does not require a Google OAuth app.

Production: https://bizly-ashen.vercel.app/

## Receipts

- Complete onboarding, then fill the issuer name, owner, ID and contact details in business settings. The business ID is required before issuing. Set the starting number before the first receipt if continuing an existing sequence.
- Use **קבלה חדשה** to record payment and issue its receipt together. Do not separately add the same payment on the income page.
- Receipt fields and issuer details are snapshotted. Requests are retry-safe; PDF downloads never allocate another number. Originals are stored in private Supabase Storage with a SHA-256 hash, without overwrite/delete policies for receipt files.
- Cancelling retains the receipt and number and marks its linked income as cancelled. It is not a replacement for legal advice about corrections or refunds.
- PDFs use an embedded Hebrew font and bidi text. Original and copy downloads are separate.
- Automatic email needs `RESEND_API_KEY` and `RECEIPT_FROM_EMAIL` on a sender domain verified with Resend. Without these, use download/share, or open an email draft and attach the downloaded PDF manually. No sender service is configured in production yet.

Never commit `.env.local` or secrets.

## Tax disclaimer

Calculations and document templates are not tax or legal advice. This is a custom-built tool, not a claim of Tax Authority software registration, approved bookkeeping, or compliant digital signatures. Verify the software, required fields, digital receipt/signature rules, cancellation process and record retention with the Israel Tax Authority or a licensed professional before using it for official receipts.
