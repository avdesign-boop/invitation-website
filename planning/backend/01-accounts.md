# Business Service

**Purpose:** business sign-up, login, and access.

## Responsibilities
- Create and manage business accounts
- Login and sessions

## Use case 1: sign up, log in, reset password
1. Sign up: the business enters name and email. We email a magic link.
2. Set password: the link opens a page to set the password. This also verifies the email.
3. Login: email and password. We create a session that lasts 30 days and return its ID in the session cookie.
4. Forgot password: the business enters its email and gets a magic link, which opens the set-password page again.

Rules:
- Each magic link works once and expires in 30 minutes.
- No Google sign-in.
- Setting a new password ends all of the business's existing sessions.
- Demo: the magic link is printed in the server log instead of emailed.

One email per business. No team access in MVP.

## Sessions
- The session is a random ID stored in an httpOnly, secure cookie named `session`. We store only a hash of it in the Session table.
- The Entry layer checks the cookie on every dashboard request with `business.validateSession`, which returns the business id. The Entry layer passes that id to the target service.
- Logout deletes the session and clears the cookie.

## Internal calls (through the shared caller function)
- `business.validateSession` takes { sessionId } and returns { businessId } or nothing.

## Data
- **Business:** id, name, unique email, password hash, email verified time.
- **MagicLink:** business, hashed token, purpose (SIGNUP or RESET), expiry, used time.
- **Session:** business, hashed session id, expiry.

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
{ Content-Type: application/json }
{ email, password }
{ 200: { business: { id, name, email } }, sets the session cookie | 401: { error: "invalid credentials" } }

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

## Data
Business. Users and roles to be decided.

## Depends on
None. Everything else depends on it.
