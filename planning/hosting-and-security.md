# Hosting and Security Plan

Status: draft for review. Figures marked "verify" come from memory and must be checked before any purchase.

## 1. Expected load

### Inputs (peak wedding season)
- 10 to 20 businesses, each handling 25 to 30 weddings: 250 to 600 weddings at once.
- 4 to 5 events per wedding.
- Opens per wedding per day: 50 to 100 on a day without an event, 500 to 1,000 on an event day.
- Opens are counted per wedding, with all its links together.
- Visitors are in and around Hyderabad, and the service stays local for at least a year.

### Traffic
| Scenario | Opens per day | Page loads per second at peak |
|---|---|---|
| Busy day: a quarter of the 600 weddings have an event | about 200,000 | about 40 |
| Worst case: all 600 weddings on an event day (not realistic) | 600,000 | about 110 |

The peak rate assumes 80% of a day's opens fall in a 6-hour window, with short bursts at 5 times that rate.

### What that means
- **Compute:** this is small. One serverless deployment handles it.
- **Database queries:** an uncached invite page makes about 4 queries. That is about 150 per second on the busy day.
- **Caching removes most of that.** If invite pages are cached at the edge for 60 seconds, the database sees each active link at most once a minute. With about 3,600 links, that is roughly 1 page build per second, or about 4 queries per second, whatever the traffic.
- **Data size:** about 40 rows per wedding, so about 25,000 rows for 600 weddings, plus login history. Well under 100 MB.
- **Bandwidth:** about 50 KB per open on average (repeat visits are mostly cached), so about 10 GB on a busy day and roughly 100 to 300 GB a month (verify against the plan's included bandwidth).

The load is not the hard part. Reliability is: no sleeping database, backups, region, and connection pooling.

## 2. Hosting plan

Budget: about ₹5,000 a month for hosting and the database.

### Application
- Stay on Vercel. Move to the Pro plan (about $20 a month) before real customers, because the free Hobby plan is for non-commercial use.
- Set the function region to Mumbai (`bom1`), the closest Vercel region to Hyderabad.

### Database
Requirements:
- Always on, never scale to zero, so no wake-up errors.
- Daily backups kept at least 7 days, and a restore test before launch.
- Connection pooling for serverless functions (use the pooled address for the app and the direct address for migrations).
- A Mumbai region, beside the functions. Visitors are served by the edge, so the database should sit next to the functions, not next to the visitors.
- Separate databases for production, preview and local work.

Comparison (prices are from third-party pages and must be verified before buying):

| Host | Region | Monthly cost (about) | Backups | Setup effort |
|---|---|---|---|---|
| Supabase Pro | Mumbai | $25 (about ₹2,200) | Daily, kept 7 days. Point-in-time recovery is an add-on at about $100 a month, and needs a larger compute size too | Under an hour. Pooling, SSL and backups are built in |
| AWS RDS PostgreSQL | Mumbai (Hyderabad also exists) | about $15 to $31 for one small instance, plus a few dollars for storage, about double with a standby (about ₹1,600 to ₹3,500) | Automated backups with point-in-time recovery included | Half a day to a day the first time, then about 1 to 2 hours a month. Needs an AWS account, network rules, SSL and a pooling step |
| Google Cloud SQL | Mumbai and Delhi | shared-core sizes about $9 to $16 (sources disagree); production sizes cost more | Backups and point-in-time recovery available (verify) | Medium. Shared-core sizes are not meant for production |
| DigitalOcean Managed PostgreSQL | Bangalore (availability not confirmed) | about $15 for one node, $30 and up with a standby | Daily backups with point-in-time recovery, 7 days | Low |
| Neon | Singapore only | usage-based, about $0.106 per compute-hour on the Launch plan | Point-in-time recovery on paid plans | Low, but the region is far from the functions |

All options need the database to accept connections from the internet over SSL, because Vercel functions do not have fixed addresses. Use a strong password and a non-default user name.

Decision: Supabase Pro in Mumbai, with daily backups kept 7 days. Point-in-time recovery, or a move to AWS RDS in Mumbai, stays an option if losing up to a day of changes becomes unacceptable.

A Hyderabad database gives no gain, because the functions run in Mumbai.

The app is plain Postgres through Prisma, so switching host later means a new database address and a data copy.

### Caching
- Invite pages are cached at the edge for 60 seconds with stale-while-revalidate.
- The owner's preview and the dashboard are never cached.
- A business sees edits on a live link within about a minute. The editor says so.

### Environments and releases
- Environments: production, preview, local. Each has its own database and its own keys.
- Database changes are SQL files in `app/prisma/migrations/`. They are applied with `npx prisma migrate deploy` before the matching deploy, as an explicit step.
- Releases go through a pull request, a type check, a lint run and a build.

### Recovery targets (proposed)
- Lose at most 24 hours of changes, and be back up within a few hours.
- The loss that matters most is invite links already shared with guests, because a recreated wedding gets new links. Daily backups keep every link older than a day.

### Monitoring
- An uptime check on one sample invite page and on `/api/config`.
- Error tracking for the server and the browser.
- Alerts by email, and optionally WhatsApp.

## 3. Security plan

### Threats and answers
| Threat | Answer |
|---|---|
| Account sharing between businesses | Emailed code on new browsers, at most 3 trusted browsers, login history (built) |
| Password guessing and email abuse | Rate limits on login, sign-up, forgot-password and code checks, per IP address and per account |
| Guessing invite links | 96-bit random tokens, redirect for unknown links, nothing shows whether a link ever existed |
| One business reading another's data | Every query is scoped to the business, plus automated tests that try cross-business access |
| Session theft | httpOnly, secure cookies, sessions stored hashed, password change ends all sessions |
| Cross-site requests | SameSite cookies and an Origin check on every state-changing request |
| Injection and scripts | Input validation on every API, React escaping, only http and https map links, Prisma for queries |
| Invite links leaking to search engines or other sites | `noindex` on invite pages and a no-referrer policy |
| Leaked secrets | Secrets only in Vercel environment settings, separate keys per environment, rotation |
| Data loss | Daily backups and a tested restore |
| Traffic floods | Edge caching of invite pages, rate limits, and the host's firewall |

### Rate limiting
Authentication endpoints get a limiter that keeps its counters in the database, since login traffic is tiny. Guest pages are protected by the cache instead.

### Security headers
Strict-Transport-Security, X-Content-Type-Options, frame protection, a Referrer-Policy, and a Content-Security-Policy that starts in report-only mode.

### Privacy
- The product stores businesses' emails and couples' names. It stores no guest list.
- Before launch: a privacy policy, terms of use, and a way to delete a business's data on request (India's DPDP Act).

### Priorities
Before launch:
- Rate limits, Origin check, security headers, `noindex` and no-referrer on invite pages.
- Cross-business access tests.
- Production database with backups and a tested restore, separate keys per environment.
- Error tracking and uptime checks.
- Privacy policy and terms.

Soon after launch:
- Enforce the Content-Security-Policy.
- Bot protection in front of the login pages.
- The trusted-devices page and the report of accounts with many devices.
- Alerts on suspicious logins.

Later:
- Optional two-step login for owners and an outside security test.

## 4. Decisions needed
1. Which monitoring and error tracking tools to use.
