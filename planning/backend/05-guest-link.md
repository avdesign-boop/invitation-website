# Invite Service

**Purpose:** the business creates invite links. The couple shares them. There is no guest list and no per-guest access control.

## What a link is
One finished invite with:
- **Type:** SUMMARY (a list of events) or SINGLE_EVENT
- **Events shown:** one event, or a chosen set (for example 2 of 4)
- **Audience label:** for example "close family" (for the business's own reference)
- **Invited by:** bride, groom or both, as a default for the link
- **Design:** for a SUMMARY link, one of the wedding package's summary designs. A SINGLE_EVENT link has no design of its own and uses the event's design.
- **Text:** the wording for this audience
- **Token:** hard-to-guess code in the web address

## Per event on a link
Each event on a link can set:
- its own time (for example 1 hour earlier for close family). If not set, the event's default time is used.
- its own invited by. If not set, the link's default is used.

## Rules
- No attendee list, no per-guest tokens. The couple sends each link only to the intended people.
- A SINGLE_EVENT link has exactly one event and no design.
- A SUMMARY link has at least one event and requires a design.
- Every event must belong to the link's wedding.
- A SUMMARY design must belong to the wedding's package and have kind SUMMARY.
- We generate a random token. The business cannot edit it.
- Changing an event's default time updates only links without an override.
- An edit applies immediately to the live link.
- Copy makes a new link with the same settings and a new token.
- Preview shows the real page to the logged-in owner, even when the link is off.
- A turned-off link shows the wedding's default page if the business enabled it, otherwise it redirects to our company website.
- A link or wedding address that does not exist redirects to our company website. Nothing tells a guest whether a link ever existed.

## Data
InviteLink and InviteLinkEvent. See `LLD.md`.

## APIs
POST /api/weddings/{id}/links
{ Cookie: session, Content-Type: application/json }
{ type, side, audienceLabel, designId?, customText, events: [ { eventId, invitedBy?, startsAt? } ] }
{ 201: { id, token, url } | 400: { error: "invalid input" } | 404: { error: "not found" } }

GET /api/weddings/{id}/links
{ Cookie: session }
{ }
{ 200: { links: [ { id, type, side, audienceLabel, enabled, eventCount, url, createdAt } ] } | 404: { error: "not found" } }

GET /api/links/{id}
{ Cookie: session }
{ }
{ 200: { id, type, side, audienceLabel, designId, customText, enabled, url, events: [ { eventId, invitedBy, startsAt } ] } | 404: { error: "not found" } }

PUT /api/links/{id}
{ Cookie: session, Content-Type: application/json }
{ type, side, audienceLabel, designId?, customText, events: [ { eventId, invitedBy?, startsAt? } ] }
{ 200: { id, url } | 400: { error: "invalid input" } | 404: { error: "not found" } }

PUT /api/links/{id}/enabled
{ Cookie: session, Content-Type: application/json }
{ enabled }
{ 200: { enabled } | 404: { error: "not found" } }

POST /api/links/{id}/copy
{ Cookie: session }
{ }
{ 201: { id, token, url } | 404: { error: "not found" } }

DELETE /api/links/{id}
{ Cookie: session }
{ }
{ 200: { message: "deleted" } | 404: { error: "not found" } }

GET /api/links/{id}/preview
{ Cookie: session }
{ }
{ 200: HTML page | 404: { error: "not found" } }

## Internal calls (through the shared caller function)
- `invite.getForRender` takes { weddingId, token } and returns { enabled, type, side, designId, customText, events: [ { eventId, invitedBy, startsAt } ] } or nothing.
- `invite.getForOwner` takes { businessId, linkId } and returns the same data for the owner's preview, even when the link is off, or nothing.
- `invite.deleteByWedding` takes { weddingId } and removes that wedding's links.
- `invite.removeEvent` takes { eventId } and removes the event from every link, deleting links left with no events.

## Depends on
Wedding, Template.
