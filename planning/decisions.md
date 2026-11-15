# Decisions

## Made
- Stack: Next.js, Postgres with Prisma, Stripe. Start as one app, split into services later if needed.
- No RSVP.
- Demo addresses carry the slug in the path: `<app-url>/w/{slug}/i/{token}`. At launch they use `{slug}.<our-domain>/i/{token}`. The Entry layer supports both.
- Demo shortcuts: magic links are printed in the server log unless an email provider is configured, and Stripe is not connected (a demo business is set to ACTIVE directly).
- Demo hosting: Vercel free tier for the app, Neon free tier for Postgres, no domain changes. At launch we add the wildcard subdomain and move the domain's nameservers to Vercel or Cloudflare.
- Events are tagged bride, groom or both.
- No guest list and no per-guest links. The business creates invite links, the couple shares them.
- A link is either a single event or a summary of chosen events. A summary link has its own summary design. Each event on a link can have its own time and invited by.
- A link can override an event's time. If not set, the event's default is used. For MVP, changing the default updates only links without an override.
- Pages are built on the server.
- Templates: we build every design ourselves as a coded page and sell them in packages. A package has one design per event type and several summary designs for guest types. A wedding uses one package. Businesses supply text details only.
- Architecture: modular monolith. One server, one folder per service. Each folder owns its tables and exposes a small public interface; other folders never touch its tables. Any folder can be split into its own service later.
- Services for MVP: Business, Billing, Template, Wedding, Invite, Rendering, and an Entry layer. Analytics is deferred to the last phase.
- Entry layer: one thin layer, no separate gateway service. It reads the web address, finds the wedding, and routes guest pages to Rendering and dashboard requests to the business services. It can become a real gateway if services are split.
- Database: Postgres for core data. Preview images and static design files from a CDN. No row per link open.
- Language and framework: TypeScript with Next.js (App Router) and React, styled with Tailwind CSS. All services are TypeScript for the MVP.
- Database access: Prisma. One Postgres schema per service.
- Service communication: one shared caller function for all cross-service calls; only it changes if a service is split out.
- Business login: sign up and password reset by magic link (one use, 30 minutes), login by email and password. The session is a random ID in a cookie, lasts 30 days, and is checked by the Entry layer against the Session table. A password change ends all sessions.
- Deleting a wedding is one endpoint that removes its invite links and the wedding together, all or nothing.
- One email per business. No team access in MVP.
- Email: magic links are sent through Resend's HTTP API. When `RESEND_API_KEY` and `EMAIL_FROM` are not set, the link is printed in the server log.
- Pricing: monthly plans with a limit on active weddings per plan. Plan limits are configurable so a per-wedding add-on can be added later.
- Billing: Stripe checkout and customer portal, no free trial. Every wedding not deleted counts toward the plan limit. If a plan lapses, existing invites keep working and new weddings are blocked.
- A turned-off link shows the wedding's default page if the business enabled it, otherwise redirects to our company website. A link that does not exist redirects to our company website.
- The wedding slug can be edited. Links already shared with the old slug stop working, and the business is responsible for resharing.
- Language per service is decided as each service is planned.
- No code until HLD and LLD are complete.

## Open
- Email setup before launch: a Resend account, a verified sender domain (SPF and DKIM records at the DNS provider), and the `RESEND_API_KEY` and `EMAIL_FROM` values
- How we create and add our packages and designs
- All-or-nothing deletes if services are split into separate programs
- How packages are priced: included in a plan, or sold separately
- Whether a wedding's package can change after events exist
- Launch domain setup (wildcard subdomain, nameserver move) and CDN
- Security, scaling and deployment
- Local database: Docker Postgres, own Postgres, or SQLite
- Startup name and domain (placeholder `ROOT_DOMAIN`)
- Custom domains for businesses: v1 or later
- Languages needed on the guest page
- Timezone handling: India only, or per wedding
