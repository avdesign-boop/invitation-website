# Rendering Service

**Purpose:** turn an invite link into the final HTML page.

## Flow when a link is opened
1. Read the web address: the wedding slug and the link token.
2. Load the link, its wedding, and the events it shows.
3. If missing, redirect to our company website. If turned off, show the wedding's default page if enabled, otherwise redirect to our company website.
4. Pick the design: a SINGLE_EVENT link uses the event's design. A SUMMARY link uses the link's design.
5. Find the coded page for the design by its key and give it the data below.
6. Send finished HTML (built on the server).

## Data given to a design
- Wedding: bride name, groom name
- Link: type, custom text, default invited by
- Events, in order: name, date and time (the link's override if set, else the event default), venue, address, map link, dress code, note, invited by (the link's per-event value if set, else the link default)

## Notes
- Designs are coded pages, so all of them receive the same data shape.
- A design may include scroll animations and other effects, which run in the browser.

## To decide
- Caching and cache refresh when the business edits a link
- Whether a JSON version of the data is also exposed

## Depends on
Invite, Wedding, Template, Entry layer.
