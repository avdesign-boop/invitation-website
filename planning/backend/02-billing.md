# Billing Service

**Purpose:** businesses pay for our product and get plan limits. Payments run through Stripe.

## Demo
Stripe is not connected. A demo business has an ACTIVE Subscription set directly in the database, so the wedding limit check passes. The checkout, portal and webhook APIs are built after the demo.

## Pricing
Monthly plans. Each plan has a price and a limit on the number of weddings. No free trial. Limits are configurable so a per-wedding add-on can be added later.

## Flow
1. The business sees the plans.
2. It picks one, and we send it to Stripe's checkout page.
3. Stripe tells us when payment succeeds, and we activate the plan.
4. Upgrade, downgrade, cancel, invoices and card changes happen in Stripe's customer portal.
5. Before a wedding is created, Wedding asks Billing whether the limit allows another.

## Rules
- Every wedding that is not deleted counts toward the limit.
- Only an ACTIVE subscription can create new weddings.
- If a plan lapses, existing invites keep working. New weddings are blocked until payment resumes.
- A business with a subscription changes plans in the customer portal, not through checkout.
- Webhook events are handled once each; repeated events are ignored.

## Data
- **Plan:** name, monthly price, currency, wedding limit, Stripe price id, active flag.
- **Subscription:** business (one per business), plan, Stripe customer id, Stripe subscription id, status (NONE, ACTIVE, PAST_DUE or CANCELED), current period end.
- **StripeEvent:** event id, processed time.

## APIs
GET /api/billing/plans
{ }
{ }
{ 200: { plans: [ { id, name, priceMonthly, currency, weddingLimit } ] } }

POST /api/billing/checkout
{ Cookie: session, Content-Type: application/json }
{ planId }
{ 200: { checkoutUrl } | 404: { error: "plan not found" } | 409: { error: "already subscribed, use the portal" } }

POST /api/billing/portal
{ Cookie: session }
{ }
{ 200: { portalUrl } | 400: { error: "no subscription" } }

GET /api/billing/subscription
{ Cookie: session }
{ }
{ 200: { plan: { id, name } | null, status, currentPeriodEnd, usage: { weddings, limit } } | 401: { error: "not logged in" } }

POST /api/billing/webhook
{ Stripe-Signature, Content-Type: application/json }
{ Stripe event }
{ 200: { received: true } | 400: { error: "invalid signature" } }

Events handled: checkout completed, subscription updated, subscription deleted, invoice payment failed.

## Internal calls (through the shared caller function)
- `billing.canCreateWedding` takes { businessId } and returns { allowed, reason? }. It uses `wedding.countByBusiness` to get the current count.

## To decide
- Plan names, prices and limits
- How packages are priced: included in a plan, or sold separately
- Currency and tax invoices

## Depends on
Business, Wedding.
