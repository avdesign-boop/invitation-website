# Low-Level Design

## Data model (Postgres)
- **Business:** id, name, unique email, password hash, email verified time.
- **MagicLink:** business, hashed token, purpose (SIGNUP or RESET), expiry, used time.
- **Session:** business, hashed session id, expiry.
- **Package:** name, description, preview image URL, active flag.
- **Design:** package, unique `key` (the coded page), name, kind (EVENT or SUMMARY), event type (EVENT designs only), guest type (SUMMARY designs only), preview image URL, active flag.
- **Plan:** name, monthly price, currency, wedding limit, Stripe price id, active flag.
- **Subscription:** business (one per business), plan, Stripe customer id, Stripe subscription id, status (NONE, ACTIVE, PAST_DUE or CANCELED), current period end.
- **StripeEvent:** event id, processed time.
- **Wedding:** business, unique `slug` (the name used in the invite address), brideName, groomName, package, showDefaultPageWhenOff (default false).
- **Event:** wedding, name, `side` (BRIDE, GROOM or BOTH), venue, address, mapUrl, `startsAt` (default time), dressCode, note, design (an EVENT design), sortOrder.
- **InviteLink:** wedding, unique `token`, type (SUMMARY or SINGLE_EVENT), default invited by, audience label, design (SUMMARY links only), custom text, enabled flag.
- **InviteLinkEvent:** link, event, sortOrder, optional invited by, optional `startsAt` override. Unique per link and event.

## Rules
- Sessions are random IDs in the `session` cookie, stored hashed in the Session table. The Entry layer checks them with `business.validateSession` and passes the business id to services.
- Deleting a wedding is one endpoint. It removes the wedding's invite links and the wedding together, all or nothing.
- Time shown for an event on a link: the link's `startsAt` override if set, else the event's default.
- Invited by for an event on a link: the per-event value if set, else the link's default.
- Design: a SINGLE_EVENT link shows the event's design. A SUMMARY link uses the link's design.
- An event's design must be an EVENT design in the wedding's package. A SUMMARY link's design must be a SUMMARY design in the wedding's package.
- Changing an event's default time updates only links without an override.
- A disabled link shows the wedding's default page if `showDefaultPageWhenOff` is on, otherwise redirects to our company website.
- A link that does not exist, or belongs to a different wedding slug, redirects to our company website.
- Times display in Asia/Kolkata.
- The Entry layer reads the wedding slug from the path `/w/{slug}/...` (demo) or from the host name `{slug}.<our-domain>` (launch). The invite URL returned to the business uses whichever style is active.

## Services (one folder each, one server)
Business, Billing, Template, Wedding, Invite, Rendering, Entry layer. Each owns its tables and exposes a small public interface. Other folders never read its tables directly. Each service's tables live in their own Postgres schema, and Prisma is used for database access. Details in `planning/backend/`.

## Service calls
All cross-service calls go through one caller function that takes an operation name (such as `wedding.getEvents`) and typed input, and returns typed output. Each service registers its operations with it. No service imports another service's code or reads its tables.

## Link open flow
See `planning/backend/10-link-open-flow.md`.

## Not decided yet
Launch domain setup, security and deployment, package pricing.
