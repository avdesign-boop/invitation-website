# Entry Layer (gateway plus domain lookup)

Decided: one thin layer in the same server, no separate gateway. It reads the web address, finds the wedding, and routes guest pages to Rendering and dashboard requests to the business services. It can become a real gateway later.

**Purpose:** each wedding gets an address with our startup's name in it.

## Responsibilities
- Demo: read the wedding slug from the path `/w/{slug}/...`
- Launch: read the slug from the host name `{slug}.<our-domain>`, using wildcard DNS and a wildcard certificate
- Map the slug to the wedding
- Reserved names (www, app, admin)
- Check the session cookie on dashboard requests (`business.validateSession`) and pass the business id to the target service
- Later: custom domains per business

## To decide
- Startup name and domain
- Launch DNS provider: Vercel or Cloudflare (needs the domain's nameservers moved)
- Custom domains in v1 or later

## Depends on
Wedding.
