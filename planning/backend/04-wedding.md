# Wedding Service

**Purpose:** a wedding and its events.

## Wedding
- Fields: bride name, groom name, slug, and a switch "show default page when a link is off" (off by default). When on, a turned-off link shows a basic page with the bride and groom names. When off, a turned-off link redirects to our company website.
- The slug is suggested from the names, for example `aarav-meera`, and the business can change it.
- Slug rules: lowercase letters, numbers and hyphens, 3 to 40 characters, unique, and not a reserved name (`www`, `app`, `admin`, `api`).
- The slug can be edited at any time. Links already shared contain the old slug and stop working after a change. The editor shows a clear warning before saving. The business is responsible for resharing.
- Creating a wedding is checked against the plan's wedding limit (details in Billing).

- Each wedding uses one package, chosen at creation.

## Event
- Fields: name, side (BRIDE, GROOM or BOTH), venue, address, map link, start time, dress code, note, design, order.
- The design must be an EVENT design in the wedding's package.
- Start time is stored with its timezone and shown in Asia/Kolkata.

## Data
Wedding and Event. See `LLD.md`.

## APIs
GET /api/weddings/slug-check?slug={slug}
{ Cookie: session }
{ }
{ 200: { available: true | false } | 400: { error: "invalid slug" } }

POST /api/weddings
{ Cookie: session, Content-Type: application/json }
{ brideName, groomName, slug, packageId }
{ 201: { id, slug } | 400: { error: "invalid input" } | 403: { error: "plan limit reached" } | 409: { error: "slug taken" } }

GET /api/weddings
{ Cookie: session }
{ }
{ 200: { weddings: [ { id, brideName, groomName, slug, eventCount, createdAt } ] } }

GET /api/weddings/{id}
{ Cookie: session }
{ }
{ 200: { id, brideName, groomName, slug, packageId, showDefaultPageWhenOff, events: [ Event ] } | 404: { error: "not found" } }

PUT /api/weddings/{id}
{ Cookie: session, Content-Type: application/json }
{ brideName, groomName, slug, showDefaultPageWhenOff }
{ 200: { id, slug } | 400: { error: "invalid input" } | 404: { error: "not found" } | 409: { error: "slug taken" } }

DELETE /api/weddings/{id}
{ Cookie: session }
{ }
{ 200: { message: "deleted" } | 404: { error: "not found" } }

POST /api/weddings/{id}/events
{ Cookie: session, Content-Type: application/json }
{ name, side, venue, address, mapUrl, startsAt, dressCode, note, designId }
{ 201: { id } | 400: { error: "invalid input" } | 404: { error: "not found" } }

PUT /api/events/{id}
{ Cookie: session, Content-Type: application/json }
{ name, side, venue, address, mapUrl, startsAt, dressCode, note, designId }
{ 200: { id } | 400: { error: "invalid input" } | 404: { error: "not found" } }

DELETE /api/events/{id}
{ Cookie: session }
{ }
{ 200: { message: "deleted" } | 404: { error: "not found" } }

PUT /api/weddings/{id}/events/order
{ Cookie: session, Content-Type: application/json }
{ eventIds: [ id ] }
{ 200: { message: "reordered" } | 400: { error: "ids do not match the wedding's events" } | 404: { error: "not found" } }

## Rules
- A business only sees its own weddings and events.
- Deleting a wedding is one endpoint. In one all-or-nothing step it asks the Invite service to remove the wedding's invite links (`invite.deleteByWedding`), then removes the events and the wedding.
- Deleting an event removes it from every invite link that shows it (`invite.removeEvent`). A link left with no events is deleted.
- The editor asks for confirmation before any delete.

## Internal calls (through the shared caller function)
- `wedding.findBySlug` takes { slug } and returns { id, brideName, groomName, showDefaultPageWhenOff } or nothing.
- `wedding.getEvents` takes { weddingId, eventIds } and returns the events in that order, each with its designId.
- `wedding.countByBusiness` takes { businessId } and returns the number of weddings.

## To decide
- Whether the package can change after events exist

## Depends on
Business, Billing (plan limit), Template (package and event designs), Invite (removing links).
