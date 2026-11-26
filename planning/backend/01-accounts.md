# Business Service

**Purpose:** business sign-up, login, and access.

## Responsibilities
- Create and manage business accounts
- Login with device verification, and sessions

## Use case 1: sign up, log in, reset password
1. Sign up: the business enters name and email. We email a magic link.
2. Set password: the link opens a page to set the password. This also verifies the email.
3. Login: email and password. On a trusted browser we create a session that lasts 30 days and return its ID in the session cookie. On any other browser we first email a 6-digit code (see Device verification).
4. Forgot password: the business enters its email and gets a magic link, which opens the set-password page again.

Rules:
- Each magic link works once and expires in 30 minutes.
- No Google sign-in.
- Setting a new password ends all of the business's existing sessions and removes all of its trusted devices.
- Magic links and login codes are emailed through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set. Otherwise they are printed in the server log.
- With `SIGNUP_ENABLED` off, sign-up returns 403 "sign-up is turned off".

One email per business. No team access in MVP.

## Device verification
Purpose: stop one account being shared between businesses.
- A device is a browser. A trusted browser holds a long-lasting httpOnly, secure cookie named `device` with a random ID. We store only its hash in the TrustedDevice table.
- After the password is correct, the login succeeds at once if the `device` cookie matches a TrustedDevice of the account that was verified in the last 30 days. Otherwise we create a LoginChallenge, email a 6-digit code to the account's email, and answer `verificationRequired`.
- The code expires in 10 minutes, works once, and allows 5 wrong attempts.
- A correct code trusts the browser (verified time set to now), sets the `device` cookie, and starts the session.
- Each account trusts at most 3 devices. A fourth approval replaces the least recently used device.
- A trusted device must be approved with a new code 30 days after its last code check, even if it is used every day.
- Every login step is recorded in the LoginEvent table with its result, time, IP address, browser description and device. A report of accounts with many devices or IP addresses is built later.
- With `DEVICE_VERIFICATION_ENABLED` off, the code step is skipped and every correct password logs in.

## Sessions
- The session is a random ID stored in an httpOnly, secure cookie named `session`. We store only a hash of it in the Session table.
- The Entry layer checks the cookie on every dashboard request with `business.validateSession`, which returns the business id. The Entry layer passes that id to the target service.
- Logout deletes the session and clears the cookie. The `device` cookie stays.

## Internal calls (through the shared caller function)
- `business.validateSession` takes { sessionId } and returns { businessId } or nothing.

## Data
- **Business:** id, name, unique email, password hash, email verified time.
- **MagicLink:** business, hashed token, purpose (SIGNUP or RESET), expiry, used time.
- **Session:** business, hashed session id, expiry.
- **TrustedDevice:** business, hashed device id, browser description, verified time, last used time, created time.
- **LoginChallenge:** business, hashed code, expiry, wrong-attempt count, used time.
- **LoginEvent:** business, result (SUCCESS, CODE_SENT, CODE_VERIFIED, WRONG_PASSWORD, WRONG_CODE), time, IP address, browser description, device (optional).

## APIs
POST /api/business/signup
{ Content-Type: application/json }
{ name, email }
{ 200: { message: "sent" } }

POST /api/business/set-password
{ Content-Type: application/json }
{ token, password }
{ 200: { message: "password set" } | 400: { error: "invalid or expired link" } }

POST /api/business/login
{ Content-Type: application/json, Cookie: device (when the browser has one) }
{ email, password }
{ 200: { business: { id, name, email } }, sets the session cookie | 200: { verificationRequired: true, challengeId } | 401: { error: "invalid credentials" } }

POST /api/business/verify-device
{ Content-Type: application/json }
{ challengeId, code }
{ 200: { business: { id, name, email } }, sets the session and device cookies | 400: { error: "invalid or expired code" } | 429: { error: "too many attempts" } }

POST /api/business/forgot-password
{ Content-Type: application/json }
{ email }
{ 200: { message: "sent" } always, whether or not the email exists }

POST /api/business/logout
{ Cookie: session }
{ }
{ 200: { message: "logged out" }, ends the session and clears the session cookie }

GET /api/business/me
{ Cookie: session }
{ }
{ 200: { id, name, email } | 401: { error: "not logged in" } }

## Depends on
None. Everything else depends on it.
