# Planning Index

Master file. Each item links to a detail file. Fill in the detail files before building.

## Product summary
B2B platform. Invitation businesses subscribe, pick one of our template packages, and create wedding invitation websites. Guests open an invite link on phone or browser. Multiple events per wedding, bride-side and groom-side events. The business creates invite links (summary or single event, per audience and side); the couple shares them. No guest list. Each wedding has a domain with our startup's name in it. No RSVP.

## Product tasks
1. Business onboarding
2. Package library
3. Create a wedding invite
4. Invite links
5. Wedding domain
6. Guest experience
7. Billing
8. Business dashboard

## Backend services
| # | Service | Detail file | Status |
|---|---|---|---|
| 1 | Business | [backend/01-accounts.md](backend/01-accounts.md) | planning |
| 2 | Billing | [backend/02-billing.md](backend/02-billing.md) | planning |
| 3 | Template (packages and designs) | [backend/03-template.md](backend/03-template.md) | planning |
| 4 | Wedding | [backend/04-wedding.md](backend/04-wedding.md) | planning |
| 5 | Invite | [backend/05-guest-link.md](backend/05-guest-link.md) | planning |
| 6 | Rendering | [backend/06-invitation-rendering.md](backend/06-invitation-rendering.md) | planning |
| 7 | Entry layer (gateway plus domain lookup) | [backend/07-domain.md](backend/07-domain.md) | planning |
| 8 | Analytics | [backend/09-analytics.md](backend/09-analytics.md) | not started |

Related flow: [backend/10-link-open-flow.md](backend/10-link-open-flow.md) (what happens when a link is opened)

## Frontend
| # | Area | Detail file | Status |
|---|---|---|---|
| 1 | Marketing, sign-up, login, plan selection | [frontend/01-marketing-and-auth.md](frontend/01-marketing-and-auth.md) | not started |
| 2 | Dashboard home | [frontend/02-dashboard-home.md](frontend/02-dashboard-home.md) | not started |
| 3 | Wedding setup screens | [frontend/03-wedding-setup.md](frontend/03-wedding-setup.md) | not started |
| 4 | Package library | [frontend/04-templates.md](frontend/04-templates.md) | planning |
| 5 | Billing screens | [frontend/05-billing.md](frontend/05-billing.md) | not started |
| 6 | Guest invitation page | [frontend/06-guest-page.md](frontend/06-guest-page.md) | planning |
| 7 | Maps, calendar, language, theme | [frontend/07-guest-extras.md](frontend/07-guest-extras.md) | not started |
| 8 | Design system and shared parts | [frontend/08-design-system.md](frontend/08-design-system.md) | not started |

## Cross-cutting
- [decisions.md](decisions.md): decisions made and open questions
- [end-to-end-flow.md](end-to-end-flow.md): the whole journey, step by step
- [build-plan.md](build-plan.md): the order to build in, with done-when checks

## Working rules (from Claude.md)
Ask before infra changes and before running tools. Summary after every code change. Keep HLD.md and LLD.md updated. No code comments unless asked.
