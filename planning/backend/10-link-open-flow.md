# Link Open Flow and API

**Purpose:** what happens, step by step, when a guest opens an invite link.

## Public route
GET <app-url>/w/{slug}/i/{token} (demo) or GET {slug}.<our-domain>/i/{token} (launch)
{ Host }
{ }
{ 200: HTML invite page | 200: HTML default page (link is off and the wedding enabled it) | 302: redirect to our company website (link or wedding does not exist, or link is off and no default page) | 500: generic error page }

There is no JSON API for this flow. The server sends finished HTML.

## Steps
1. The Entry layer reads the wedding slug from the path (demo) or the host (launch) and calls the Wedding service to find the wedding.
2. The Rendering service reads the token from the path and calls the Invite service for that link.
3. If the wedding or link is missing, or the link belongs to a different wedding, redirect to our company website.
4. If the link is off, show the wedding's default page when `showDefaultPageWhenOff` is on, otherwise redirect to our company website.
5. Load the events the link shows, in order.
6. Time rule: for each event, use the link's time override if set, else the event's default time.
7. Invited by rule: for each event, use the link's per-event value if set, else the link's default.
8. Design rule: a SINGLE_EVENT link uses the event's design. A SUMMARY link uses the link's design.
9. Fill the coded page for that design with the data and build the HTML.
10. Send the page. The browser then runs the animations and loads any static files from the CDN.

## Internal calls (through the shared caller function)
- `wedding.findBySlug` takes { slug } and returns { id, brideName, groomName, showDefaultPageWhenOff } or nothing.
- `invite.getForRender` takes { weddingId, token } and returns { enabled, type, side, designId, customText, events: [ { eventId, invitedBy, startsAt } ] } or nothing.
- `wedding.getEvents` takes { weddingId, eventIds } and returns the events in that order, each with its designId.
- `template.getDesigns` takes { designIds } and returns { id, key, kind } for each.

## Caching
Wedding, link and design data are read from the database on each request in the MVP. The design rows change rarely and can be cached later.

## Errors
- A design key with no coded page, or broken data: generic error page, error logged for us.

## Depends on
Entry layer, Wedding, Invite, Template, Rendering.
