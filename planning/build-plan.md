# Build Plan (Demo)

Build in order. Each step lists what to build, where the details live, and how to know it is done. Frontend screens come last.

## Working rules
- Ask before any infra change and before running tools.
- Give a short summary after every code change.
- Update `HLD.md` and `LLD.md` when a step changes the design.
- No code comments unless asked.
- Node 18 is installed. Use Next.js 15 and Tailwind CSS 3.

## Step 1: Foundation
**Status:** done.

**Build**
- Next.js app in `app/` (TypeScript, App Router, Tailwind CSS 3), replacing its current contents.
- One folder per service: business, billing, template, wedding, invite, rendering, entry.
- Prisma with one Postgres schema per service, with the tables in `LLD.md`.
- The shared caller function: takes an operation name and typed input, returns typed output. Each service registers its operations with it.
- Database connection. Ask first how to run Postgres (Neon, Docker or your own).

**Done when** the app starts, the tables exist, and a test operation can be called through the caller function.

## Step 2: Business service
**Status:** done, including the sign-up, login, set-password and forgot-password pages.

**Build** signup, set-password, login, forgot-password, logout, me, and `business.validateSession`. Magic links are emailed through Resend when configured, otherwise printed in the server log. Details: `backend/01-accounts.md`.

**Done when** a business can sign up from the log link, set a password, log in, see `me`, and log out. A password change ends other sessions.

## Step 3: Template service
**Status:** done.

**Build** Package and Design tables, a seed with one demo package, the coded designs, `GET /api/packages`, `GET /api/packages/{id}`, `template.getDesign`, `template.getDesigns`. Details: `backend/03-template.md`.

The demo package needs EVENT designs for a few event types (for example Mehendi, Haldi, Sangeet, Wedding Ceremony) and at least two SUMMARY designs for different guest types.

**Done when** the package APIs return the seeded designs.

## Step 4: Wedding service
**Status:** done.

**Build** slug check, wedding create, list, get, edit and delete, event add, edit, delete and reorder, `wedding.findBySlug`, `wedding.getEvents`, `wedding.countByBusiness`. Wedding create calls `billing.canCreateWedding`. Details: `backend/04-wedding.md`.

Billing for the demo has only `billing.canCreateWedding`, which checks that the business has an ACTIVE subscription. A seeded demo business is ACTIVE. Details: `backend/02-billing.md`.

**Done when** a logged-in business can create a wedding with a package, add events with designs, and delete the wedding.

## Step 5: Invite service
**Status:** done.

**Build** link create, list, get, edit, enable or disable, copy, delete and preview, `invite.getForRender`, `invite.deleteByWedding`. Wedding delete calls `invite.deleteByWedding` in one all-or-nothing step. Details: `backend/05-guest-link.md`.

**Done when** a business can create single-event and summary links and the rules in `LLD.md` are enforced (design kinds, package match, per-event time and invited by).

## Step 6: Entry layer and Rendering
**Status:** done.

**Build**
- Entry layer: read the slug from the path `/w/{slug}/...`, check the session cookie on dashboard requests, route guest pages to Rendering.
- Rendering: the guest page at `/w/{slug}/i/{token}`. Apply time and invited-by overrides, pick the design, render the coded page, handle the turned-off and not-found cases.

Details: `backend/06-invitation-rendering.md`, `backend/07-domain.md`, `backend/10-link-open-flow.md`.

**Done when** a link opens and shows the right designs, times and names, and a missing or turned-off link behaves as specified.

## Step 7: Demo data and end-to-end check
**Status:** demo seed built. The end-to-end run-through is pending.

**Build** a demo seed: a demo business set to ACTIVE, one wedding with its events and several links (a summary link and single-event links, with different times and invited by).

**Done when** the whole flow in `end-to-end-flow.md` runs from sign-up to viewing the invite.

## Step 8: Frontend screens
**Status:** done.

**Build** the dashboard screens in `frontend/`: marketing and login, dashboard home, wedding setup (couple, events, links, preview), package library. Billing screens come after the demo. The screen details are planned when we reach this step.

**Done when** a business can do the full flow in the browser.

## Step 9: Deploy
**Status:** Neon database linked. Deploy to Vercel in progress.

**Build** deploy to Vercel with Neon Postgres. Ask before any infra change. No domain changes for the demo.

**Done when** your partner can open the demo and a sample invite link.

## After the demo
Stripe checkout, portal and webhook, email setup (Resend account and sender domain), wildcard subdomain addresses, analytics, custom domains. See `decisions.md` for open points.
