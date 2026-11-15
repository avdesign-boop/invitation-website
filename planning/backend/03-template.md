# Template Service

**Purpose:** the catalog of packages and designs that businesses choose from. We build every design ourselves as a coded page. Businesses cannot create or upload designs.

## Packages and designs
- We sell packages. A package is a set of designs with a shared look.
- A package has one EVENT design for each event type (for example Mehendi, Haldi, Sangeet, Wedding Ceremony) and one or more SUMMARY designs for different guest types (for example close family, friends).
- A business picks one package for each wedding. Each event in the wedding uses its design from that package. A SINGLE_EVENT link shows the event's design. A SUMMARY link uses one of the package's summary designs, chosen by the business.
- Each design is a coded page, found by its `key`. Scroll animations and other effects are part of the code.

## What the business can change
Text only: couple names, event name, date and time, venue, address, dress code, note, invited by, and the link's custom text. No photos, videos or layout changes.

## Adding packages
We add a design in code and add its Package and Design rows. There is no business-facing flow for this.

## Data
- **Package:** name, description, preview image URL, active flag.
- **Design:** package, unique `key` (the coded page), name, kind (EVENT or SUMMARY), event type (EVENT designs only), guest type (SUMMARY designs only), preview image URL, active flag.

## APIs
GET /api/packages
{ Cookie: session }
{ }
{ 200: { packages: [ { id, name, description, previewImageUrl, designCount } ] } | 401: { error: "not logged in" } }

GET /api/packages/{id}
{ Cookie: session }
{ }
{ 200: { id, name, description, previewImageUrl, designs: [ { id, key, name, kind, eventType, guestType, previewImageUrl } ] } | 404: { error: "not found" } }

## Internal calls (through the shared caller function)
- `template.getDesign` takes { designId } and returns { id, packageId, key, kind, eventType } or nothing.
- `template.getDesigns` takes { designIds } and returns the same for each id.

## To decide
- How packages are priced (see Billing)
- Which event types and guest types the first packages cover

## Depends on
None.
