# Secure OAuth With Role-Based Authorization

## Ticketing module

The repo now also includes a Maintenance and Incident Ticketing System.

- Guide: `TICKETING_SYSTEM_GUIDE.md`
- Express backend: `ticketing-api`
- React pages: `client/src/pages/Tickets`
- Schema docs: `ticketing-api/docs`

This project now uses Spring Security session authentication instead of the insecure `X-Auth-User-Id` header.

## What changed

- `X-Auth-User-Id` was removed from protected API access.
- Local sign-in and Google sign-in now create a secure Spring Security session.
- LinkedIn OAuth sign-in now uses a server-side authorization code callback and the same Spring Security session model.
- GitHub OAuth sign-in now uses a server-side authorization code callback and the same Spring Security session model.
- Protected API calls from the React client now use `credentials: "include"`.
- The backend enforces authentication and admin-only access through Spring Security.
- The current user session is restored through `GET /api/auth/me`.
- Sign-out is handled through `POST /api/auth/signout`.
- Role request SSE updates now use the authenticated session instead of a client-supplied `userId`.
- User roles are refreshed from MongoDB on each request so role changes take effect without trusting stale client data.

## Protected access rules

- Public:
  - `GET /api/auth/config`
  - `GET /api/auth/linkedin/authorize`
  - `GET /api/auth/linkedin/callback`
  - `GET /api/auth/github/authorize`
  - `GET /api/auth/github/callback`
  - `POST /api/auth/signup`
  - `POST /api/auth/signin`
  - `POST /api/auth/google`
- Authenticated:
  - `GET /api/auth/me`
  - `POST /api/auth/signout`
  - My role request endpoints
  - Role request SSE stream
- Admin only:
  - `GET /api/users`
  - `PATCH /api/users/{id}/role`
  - Admin role request review endpoints

## Security details

- Spring Security session cookie:
  - HttpOnly
  - SameSite=Lax
  - 30 minute session timeout
- Session IDs are rotated on sign-in to reduce session fixation risk.
- API responses now return JSON `401` and `403` messages for unauthorized and forbidden access.

## LinkedIn setup

- Add these values to `server/.env`:
  - `LINKEDIN_CLIENT_ID`
  - `LINKEDIN_CLIENT_SECRET`
  - `LINKEDIN_REDIRECT_URI`
  - `LINKEDIN_CLIENT_REDIRECT_URI`
- `LINKEDIN_REDIRECT_URI` must match the HTTPS callback URL configured in the LinkedIn Developer Portal.
- `LINKEDIN_CLIENT_REDIRECT_URI` should point to the React app after sign-in and defaults to `http://localhost:5173/`.
- The LinkedIn app must have the `Sign in with LinkedIn using OpenID Connect` product enabled with `openid`, `profile`, and `email` scopes.

## GitHub setup

- Add these values to `server/.env`:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_REDIRECT_URI`
  - `GITHUB_CLIENT_REDIRECT_URI`
- `GITHUB_REDIRECT_URI` must match the callback URL configured in your GitHub OAuth app settings.
- `GITHUB_CLIENT_REDIRECT_URI` should point to the React app after sign-in and defaults to `http://localhost:5173/`.
- The GitHub OAuth app should request `read:user` and `user:email` so the server can restore the user's profile and verified email address.

## Verification

- Backend tests: `server\\mvnw.cmd test`
- Frontend build: `npm run build` inside `client`


linken developer : https://www.linkedin.com/developers/apps/232180433


gitgub :- https://github.com/settings/applications/3514299
