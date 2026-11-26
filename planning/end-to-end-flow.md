# End-to-End Flow

Every request from the browser enters through the Entry layer. For dashboard calls it checks the session cookie with `business.validateSession` and passes the business id to the target service. Services talk to each other only through the shared caller function (shown as `service.operation`).

## 1. Business registers and subscribes

| Step | Browser to Entry layer | Internal calls |
|---|---|---|
| Sign up | POST /api/business/signup { name, email } | `business.signup` creates the Business and a SIGNUP MagicLink, then sends the email |
| Open the emailed link | Browser opens the set-password page | none |
| Set password | POST /api/business/set-password { token, password } | `business.setPassword` checks the token (unused, not expired), saves the password hash, marks the email verified, ends the business's existing sessions |
| Log in | POST /api/business/login { email, password } | `business.login` checks the password. On a trusted device it creates a Session and the Entry layer sets its ID in the session cookie. On any other browser it emails a 6-digit code and answers `verificationRequired` |
| Verify the browser | POST /api/business/verify-device { challengeId, code } | `business.verifyDevice` checks the code, trusts the browser (at most 3 devices per account), and creates a Session. The Entry layer sets the session and device cookies |
| See plans | GET /api/billing/plans | `billing.listPlans` |
| Choose a plan | POST /api/billing/checkout { planId } | `billing.createCheckout` creates the Stripe checkout and returns its URL |
| Pay | The browser goes to Stripe | none |
| Stripe confirms | Stripe calls POST /api/billing/webhook (signature, no cookie) | `billing.handleWebhook` verifies the signature, ignores repeated events, sets the Subscription to ACTIVE |

## 2. Business browses packages

| Step | Browser to Entry layer | Internal calls |
|---|---|---|
| List packages | GET /api/packages | `template.listPackages` |
| View a package | GET /api/packages/{id} | `template.getPackage` returns the package with its EVENT and SUMMARY designs and previews |

## 3. Business creates a wedding, events and an invite link

| Step | Browser to Entry layer | Internal calls |
|---|---|---|
| Check the slug | GET /api/weddings/slug-check?slug=aarav-meera | `wedding.slugCheck` |
| Create the wedding | POST /api/weddings { brideName, groomName, slug, packageId } | `wedding.create` calls `billing.canCreateWedding`, which calls `wedding.countByBusiness`. If allowed, the Wedding is saved with its package |
| Add an event | POST /api/weddings/{id}/events { name, side, venue, address, mapUrl, startsAt, dressCode, note, designId } | `wedding.addEvent` calls `template.getDesign` to confirm the design is an EVENT design in the wedding's package, then saves the event |
| Create a single-event link | POST /api/weddings/{id}/links { type: SINGLE_EVENT, side, audienceLabel, customText, events: [ { eventId, invitedBy?, startsAt? } ] } | `invite.create` calls `wedding.getEvents` to confirm the event belongs to the wedding, then saves the link with a random token and returns its URL |
| Create a summary link | POST /api/weddings/{id}/links { type: SUMMARY, side, audienceLabel, designId, customText, events: [ ... ] } | Same as above, plus `template.getDesign` to confirm the design is a SUMMARY design in the wedding's package |
| Preview | GET /api/links/{id}/preview | `invite.getForOwner`, then the same rendering steps as in section 4 |
| Delete a wedding | DELETE /api/weddings/{id} | `wedding.delete` runs all or nothing: `invite.deleteByWedding`, then removes the events and the wedding |

## 4. Guest views the invite

| Step | Request | Internal calls |
|---|---|---|
| Open the link | GET <app-url>/w/aarav-meera/i/{token} (demo) or aarav-meera.ourdomain.com/i/{token} (launch) | none yet |
| Find the wedding | Entry layer reads the slug from the path (demo) or the host (launch) | `wedding.findBySlug` |
| Load the link | Rendering reads the token | `invite.getForRender` (wedding id and token) |
| Load event details | Rendering | `wedding.getEvents` (the link's event ids, in order, each with its design id) |
| Load designs | Rendering | `template.getDesigns` (the event designs for a single-event link, or the link's design for a summary link) |
| Build the page | Rendering applies time and invited-by overrides and fills the coded page for each design | none |
| Respond | 200 HTML. The browser runs the scroll animations and loads static files from the CDN | none |

Not-found and turned-off cases are described in `backend/10-link-open-flow.md`.

## Demo
A demo skips the register, plan and payment steps in section 1 by using the settings and sample data described in `demo.md`.

## Open points
1. Email setup before launch: a Resend account, a verified sender domain, the API key and the sender address.
2. How we create and add our packages and designs.
3. How packages are priced: included in a plan, or sold separately.
4. Whether a wedding's package can change after events exist.
5. All-or-nothing deletes if services are split into separate programs.
6. Launch domain setup (wildcard subdomain, nameserver move) and where preview images and static design files are hosted.
