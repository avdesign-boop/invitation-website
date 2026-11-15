# Demo

A demo is the full product with a few settings changed, plus sample data. No other code knows about it.

## Settings for a demo
Set these as environment variables (in Vercel or in `app/.env`):
- `SIGNUP_ENABLED=false`: business sign-up returns an error and the login page hides the sign-up link.
- `BILLING_ENABLED=false`: every business can create weddings and Stripe is not used.
- `LOGIN_HINT_EMAIL` and `LOGIN_HINT_PASSWORD`: the demo account. The login page shows it with a button that fills it in, so anyone who opens the login page can see these values. The sample data seed creates this account.
- Leave `RESEND_API_KEY` and `EMAIL_FROM` unset, so magic links are printed in the server log.

## Sample data
- `app/demo/data.json` holds the business name, plan, package, wedding, events and invite links.
- `app/demo/seed.ts` loads it into the database.
- The main seed (`npx prisma db seed`) must run first, because it creates the package and designs.

## Commands
Both need `DATABASE_URL`, `LOGIN_HINT_EMAIL` and `LOGIN_HINT_PASSWORD` in `app/.env` or the environment, and run from `app/`:
- `npm run seed:demo` loads the sample data. If the demo wedding already exists, it does nothing.
- `npm run demo:reset` first deletes every wedding of the demo account, including ones made during a demo, then loads the sample data again.

## Switching the demo off
- Unset the four settings. The app then runs as the full product.
- To remove the sample data code too, delete `app/demo/` and the two npm scripts `seed:demo` and `demo:reset`. No other file changes.
