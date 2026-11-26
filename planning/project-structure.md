# Project Structure and Low-Level Flow

The code lives in `app/` (one Next.js 15 app, TypeScript, App Router, Tailwind CSS 3, Prisma, Postgres, Zod). One server runs everything.

## Folders
- `app/app/` : Next.js routes only. `api/` holds the JSON endpoints. `w/[slug]/i/[token]/page.tsx` is the guest invite page. `page.tsx` and `layout.tsx` are the site root.
  - `login/`, `signup/`, `set-password/`, `forgot-password/` : the business account pages. Sign-up and forgot-password ask for an email and say a link was sent. `set-password` reads the token from the link, checks the two passwords match (at least 8 characters), then goes to login. `login` switches to a 6-digit code form when the API answers `verificationRequired`, and goes to the dashboard once the code is accepted.
  - `error.tsx` and `not-found.tsx` : the friendly pages for unexpected errors and unknown addresses.
  - `dashboard/` : the business screens, all client pages that call the `/api` endpoints. `layout.tsx` checks the session with `GET /api/business/me` and sends the visitor to `/login` if there is none. `page.tsx` lists weddings with a New wedding button. `weddings/new/` creates a wedding (couple names, invite address with a live availability check, package). `templates/` lists packages and shows each design as a live preview. `weddings/[id]/` edits the couple's names and each event (add, edit, delete: name, date and time, venue, address, map link, dress code, note, invited by, design), with a live preview. The couple and each event are read-only until the Edit button is pressed, and read-only again after saving. It also manages the wedding's invite links, and deletes the wedding after a confirmation.
- `app/components/` : shared screen parts. `DesignPreview` renders a coded design inside a phone-sized frame. `sampleData.ts` holds sample data for the template previews. `AuthCard` is the shared wrapper for the account pages. `LinkManager` creates, edits, copies, turns on or off, and deletes invite links.
- `app/middleware.ts` : maps `{slug}.ROOT_DOMAIN/i/{token}` to `/w/{slug}/i/{token}`. It does nothing when `ROOT_DOMAIN` is not set.
- `app/lib/` : shared helpers used by every service.
  - `call.ts` : the shared caller function (`register`, `call`) and the per-operation HTTP rules.
  - `db.ts` : the Prisma client, `withTransaction` and `isUniqueViolation`. The client adds `connect_timeout=15` to the database address when it has none, and retries a query up to three times when the database cannot be reached (for example while a sleeping database wakes up). Queries inside a transaction are not retried.
  - `errors.ts` : `AppError(status, message)`.
  - `http.ts` : `handle` (turns errors into responses) and the route builders `authedRoute` and `publicRoute`.
  - `api.ts` : the browser-side `api(method, url, body)` helper used by the dashboard pages.
  - `time.ts` : converts between stored times and the Asia/Kolkata date-time inputs.
  - `config.ts` : the feature settings (`signupEnabled`, `billingEnabled`, `loginHint`) read from environment variables.
- `app/services/` : one folder per service: `business`, `billing`, `template`, `wedding`, `invite`, `rendering`, `entry`. `services/index.ts` imports every service so all operations are registered.
- `app/prisma/` : `schema.prisma` (one Postgres schema per service) and `seed.ts`.
- `planning/` : design documents. `HLD.md` and `LLD.md` are in the folder above.

## Entry point
Every API route file starts by importing `@/lib/http`, which imports `@/services`. That registers every operation with the caller function before the route runs. The guest page imports `@/services` itself.

## How a service is written
Each service folder has the same pieces:
- `service.ts` : the functions that do the work and read or write the service's own tables.
- `index.ts` : declares each operation's input and output types (in the `Operations` interface of `@/lib/call`) and registers each function with `register`, with its HTTP rules where it is exposed as an API. This file is the service's public interface.
- `types.ts` : types shared inside the service and returned by its operations.
- `schemas.ts` : Zod schemas that validate request bodies. `index.ts` attaches them to operations.
- Extra files only where needed (`crypto.ts`, `device.ts` and `mailer.ts` in business, `token.ts` in invite, `slug.ts` in wedding, `catalog.ts` and `designs/` in template, page components in rendering).

Rules:
- A service reads only its own tables. To get anything from another service it uses `call("service.operation", input)`.
- Types for an operation live in its `index.ts`, so `call` is fully typed.
- Services throw `AppError(status, message)` for expected failures.

## How a request flows
1. A route file in `app/app/api/...` only names the operation: `export const POST = publicRoute("business.login")` or `authedRoute("wedding.create")`. The exported name is the HTTP method.
2. The service's `index.ts` registers the operation with its HTTP rules (`register(name, handler, meta)`):
   - `schema` : Zod schema for the body (or the query string on GET), imported from the service's `schemas.ts`.
   - `idParam` : the input field that receives the `[id]` from the URL (for example `weddingId`).
   - `status` : success status, default 200.
   - `message` : respond `{ message }` instead of the result.
   - `notFound` : error when the result is empty (404, or a given status and message).
   - `sessionInput` and `clearSession` : read the session id from the cookie into the input, and clear the cookie after the call.
3. `lib/http.ts` builds the input and calls the operation: `businessId` (authed routes only, from `requireBusinessId` in `services/entry/session.ts`), the URL id, the session id if asked, the device cookie, IP address and browser description if asked (`deviceInput`), then the validated body.
4. The service function runs, using `db` for its own tables and `call` for other services.
5. `lib/http.ts` sends the result as JSON. If the result has a `session` field (`{ id, expiresAt }`), it sets the session cookie, and if it has a `device` field (`{ id }`), it sets the long-lasting `device` cookie. Both fields are left out of the response. The cookie helpers are in `services/entry/session.ts`.
6. `handle` turns an `AppError` into `{ error }` with its status, a Zod error into 400, and anything else into a logged 500.

## Where things are
- API routes: `app/app/api/`
  - business: `api/business/*` (signup, set-password, login, verify-device, forgot-password, logout, me)
  - config: `api/config` (tells the login page whether sign-up is on and returns the login hint, if set)
  - packages: `api/packages`, `api/packages/[id]`
  - weddings: `api/weddings`, `api/weddings/slug-check`, `api/weddings/[id]`, `api/weddings/[id]/events`, `api/weddings/[id]/events/order`, `api/weddings/[id]/links`
  - events: `api/events/[id]`
  - links: `api/links/[id]`, `api/links/[id]/copy`, `api/links/[id]/enabled`
- Operation types: each service's `index.ts`
- Database tables: `app/prisma/schema.prisma`, with the schema (`business`, `billing`, `template`, `wedding`, `invite`) set per model
- Database changes: each schema change is an SQL file in `app/prisma/migrations/`. Apply them with `npx prisma migrate deploy` before running or deploying code that uses them. A deploy does not apply them.
- Request validation: each service's `schemas.ts`
- Design pages (coded invitations): `services/template/designs/`, registered by key in `designs/index.ts`
- Package and design catalog used by the seed: `services/template/catalog.ts`

## Guest link flow
1. `GET /w/{slug}/i/{token}` hits `app/app/w/[slug]/i/[token]/page.tsx`. On a launch host, `middleware.ts` rewrites to this path first.
2. The page calls `rendering.resolveInvite` with the slug and token.
3. `services/rendering/service.ts` calls `wedding.findBySlug`, then `invite.getForRender`, then `wedding.getEvents`, then `template.getDesign`.
4. It returns one of three results:
   - `redirect` : the page redirects to `COMPANY_URL` (default `/`).
   - `default` : the page shows `DefaultPage` with the couple's names.
   - `page` : the design key and the data (names, custom text, events with the link's time and invited-by applied).
5. For `page`, the guest page finds the coded component with `getDesignComponent(designKey)` and renders it on the server. A missing component or any error shows `ErrorPage`.

## Environment
- `DATABASE_URL` : Postgres connection.
- `APP_URL` : base address used for invite links in the demo.
- `ROOT_DOMAIN` : when set, invite links use `{slug}.ROOT_DOMAIN` and `middleware.ts` handles them.
- `COMPANY_URL` : where missing or turned-off links redirect.

## Demo versus launch
- Billing reads the Subscription row. The demo seed writes an ACTIVE row; Stripe will write the same row later.
- `services/business/mailer.ts` emails magic links and login codes through Resend's HTTP API when `RESEND_API_KEY` and `EMAIL_FROM` are set, and prints them in the server log otherwise.
- Demo data lives only in `app/demo/` (`data.json` and `seed.ts`; see `planning/demo.md`). `prisma/seed.ts` seeds only the package and designs, which stay at launch.
- Feature settings (`SIGNUP_ENABLED`, `BILLING_ENABLED`, `DEVICE_VERIFICATION_ENABLED`, `LOGIN_HINT_EMAIL`, `LOGIN_HINT_PASSWORD`) are read in `lib/config.ts`. Only the business service (sign-up and the new-device code), the billing service and `api/config` use them.
