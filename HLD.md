# High-Level Design

## Goal
B2B platform: invitation businesses buy a subscription, pick one of our template packages, and create wedding invitation websites for their couples. Guests open a link on mobile or browser. No RSVP, no guest list.

## Actors
- **Business:** pays, picks a package, creates weddings, events and invite links.
- **Couple:** receives the links from the business and shares each with the right people.
- **Guest:** opens a link and sees that invite.

## Main flow
1. Business signs up and subscribes.
2. Business creates a wedding: couple names, a slug and a package.
3. Business adds events. Each is tagged bride side, groom side, or both, and uses its design from the package.
4. Business creates invite links. Each is a single event, or a summary of chosen events with a summary design, plus audience label, text, and optional per-event time and invited by.
5. Business sends the links to the couple.
6. Guest opens the link. The demo address is `<app-url>/w/{slug}/i/{token}`. At launch it becomes `{slug}.<our-domain>/i/{token}`. The server builds that invite's page with the right design.

## Templates
We build every design ourselves as a coded page and sell them in packages. A package has one design for each event type and several summary designs for different guest types. Businesses only supply text details.

## Architecture
Modular monolith: one server, one folder per service (Business, Billing, Template, Wedding, Invite, Rendering, Entry layer). Each folder owns its tables and exposes a small public interface. Any folder can be split into its own service later.

The Entry layer checks the session on dashboard requests, reads the wedding slug from the path (demo) or the host name (launch), finds the wedding, and routes guest pages to Rendering and dashboard requests to the business services. The root domain serves the dashboard and marketing.

## Service communication
Services call each other only through one shared caller function, for example `call("wedding.getEvents", input)`. In the monolith it runs the target service's code directly. If a service is moved out, only the caller function changes to send HTTP requests. Every service defines clear inputs and outputs, and no service reads another service's tables.

## Tech stack
TypeScript with Next.js (App Router) and React for the dashboard and invite pages, styled with Tailwind CSS. Services live in separate folders inside the one app. Prisma is used for database access.

## Hosting (demo)
Vercel free tier for the app and Neon free tier for Postgres. No domain changes for the demo.

## Feature settings
Environment settings turn features on or off with no code changes:
- `SIGNUP_ENABLED` (default on): off blocks business sign-up.
- `BILLING_ENABLED` (default on): off lets every business create weddings and does not use Stripe.
- `LOGIN_HINT_EMAIL` and `LOGIN_HINT_PASSWORD` (default unset): when both are set, the login page shows that account with a button that fills it in.
- `RESEND_API_KEY` and `EMAIL_FROM`: when unset, magic links are printed in the server log.

A demo is one combination of these settings plus the sample data in `app/demo/`. See `planning/demo.md`.

## Data and storage
- Postgres for core data, with one schema per service so each service owns its tables.
- Designs are coded pages inside the app. Preview images and static design files are served from a CDN.
- No row per link open.

## Scope
- MVP: all services above.
- Last phase: analytics.
- Launch: wildcard subdomain addresses with our domain, nameserver move, CDN.
- Later: custom domains.

## Open decisions
- Launch domain setup and CDN
- Security, scaling and deployment
- How packages are priced
- Startup name and domain
