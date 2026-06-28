# PAF — Resource Management Platform

A full-stack workspace management platform for shared campus facilities — book rooms and equipment, raise maintenance/incident tickets, request role upgrades, and audit activity in one place.

- **Backend:** Spring Boot 3.5.11 (Java 21), MongoDB, Spring Security (session-based)
- **Frontend:** Vue 3 + Vite (see [`client/`](./client))
- **Demo backend:** Node/Express ticket aggregator (see [`ticketing-api/`](./ticketing-api))

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Demo Data & Credentials](#demo-data--credentials)
6. [Configuration Reference](#configuration-reference)
7. [REST API Surface](#rest-api-surface)
8. [Project Structure](#project-structure)
9. [Troubleshooting](#troubleshooting)
10. [Security Notes](#security-notes)

---

## Features

### Authentication
- Local email + password sign-up / sign-in
- Google OAuth (ID token verification)
- LinkedIn OAuth (authorization-code callback)
- GitHub OAuth (authorization-code callback)
- Server-side Spring Security sessions (`PAFSESSIONID` cookie, HttpOnly, SameSite=Lax)

### Role-Based Access Control
Four roles, four privilege tiers:

| Role | Can |
|---|---|
| `USER` | Browse resources, book, raise tickets, request role upgrade |
| `TECHNICIAN` | Pick up assigned tickets, comment, resolve, close |
| `MANAGER` | Approve/reject role requests, assign tickets, manage bookings |
| `ADMIN` | Everything above + change user roles + access audit log |

### Resource Management
- Catalogue of resources by type (`LECTURE_HALL`, `LAB`, `MEETING_ROOM`, `EQUIPMENT`)
- Status tracking (`ACTIVE`, `OUT_OF_SERVICE`)
- Availability windows per resource
- User reviews with 1–5 star ratings
- Search & filter

### Bookings
- Single bookings and recurring (DAILY / WEEKLY / MONTHLY) up to 365 occurrences
- Conflict detection on the resource calendar
- Booking lifecycle: `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`
- Admins see all bookings; users see their own

### Ticketing
- Two ticket types: `MAINTENANCE` (planned work) and `INCIDENT` (reactive)
- Four priority levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Statuses: `OPEN` → `IN_PROGRESS` → (`ON_HOLD`) → `RESOLVED` → `CLOSED`; or `CANCELLED`
- Per-priority SLA hours with auto-computed `dueAt` and `overdue` flag
- Comments, attachments, and full activity log per ticket
- Dashboard summary + reports endpoint

### Role Requests
- Users request a role upgrade with a justification
- Managers/admins approve or reject with a reason
- Server-Sent Events stream (`/api/role-requests/stream`) for live UI updates
- Approval writes an `ActivityEvent` and updates the user's role

### Activity Feed & Audit Log
- Centralised `ActivityEvent` log (role changes, request lifecycle)
- Per-user notifications with mark-as-read
- Admins can read the full audit log

---

## Architecture

```
┌────────────────────┐    HTTPS    ┌────────────────────────┐    TCP    ┌────────────────┐
│  Vue 3 SPA         │────────────▶│  Spring Boot (8081)    │──────────▶│  MongoDB Atlas │
│  (Vite, port 5173) │  cookies    │  Java 21, Spring Sec   │           │  cluster0...   │
└────────────────────┘             └────────────────────────┘           └────────────────┘
                                              │
                                              │ REST
                                              ▼
                                    ┌────────────────────────┐
                                    │  ticketing-api (Node)  │
                                    │  Express, port 3000    │
                                    └────────────────────────┘
```

- **Single source of truth** for users, resources, bookings, role requests: MongoDB via Spring Boot.
- **`ticketing-api`** is a separate Node service that aggregates ticket data into the dashboard (optional, can be skipped for local dev).

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| JDK | 21+ | Tested with OpenJDK 21.0.11 |
| Maven | 3.9+ | Or use the bundled `./mvnw` |
| Node.js | 20+ | For the frontend client and `ticketing-api` |
| MongoDB | 6+ Atlas tier or local | A free Atlas M0 cluster is enough |
| Git | any | |

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/PAF-Project-demo/PAF.git
cd PAF
```

### 2. Configure environment

Copy the example env file and edit:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set:

```dotenv
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?appName=Cluster0
MONGODB_DATABASE=paf_auth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# LinkedIn and GitHub are optional for local-only sign-in
```

### 3. Seed demo data (recommended)

Populates the database with demo users, resources, bookings, tickets, role requests, and activity events:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.enabled=true"
```

Wait for `Started ServerApplication in N seconds`, then **stop the server (Ctrl-C)**. The seeder is idempotent — re-running is a no-op unless you pass `--app.seed.reset=true` to wipe first.

### 4. Run the backend

```bash
mvn spring-boot:run
```

Backend will be at `http://localhost:8081`.

### 5. Run the frontend

```bash
cd ../client
npm install
npm run dev
```

Frontend will be at `http://localhost:5173`.

---

## Demo Data & Credentials

When seeded, the database contains the following demo accounts. **All share the same password.**

> Password: `Demo@123`

| Email | Display Name | Role |
|---|---|---|
| `demo@devgen.com` | Demo Admin | `ADMIN` |
| `manager@devgen.com` | Demo Manager | `MANAGER` |
| `tech.alex@devgen.com` | Alex Technician | `TECHNICIAN` |
| `tech.priya@devgen.com` | Priya Technician | `TECHNICIAN` |
| `user.jane@devgen.com` | Jane Doe | `USER` |
| `user.ravi@devgen.com` | Ravi Silva | `USER` |

Seeded dataset summary:

| Collection | Count | Highlights |
|---|---|---|
| `users` | 6 | One per role, password `Demo@123` |
| `resources` | 6 | 1 lecture hall, 2 labs, 2 meeting rooms, 1 equipment kit — with reviews |
| `bookings` | 4 | One each in `APPROVED`, `PENDING`, `REJECTED`, `CANCELLED` |
| `tickets` | 5 | Mix of `MAINTENANCE`/`INCIDENT`, all 4 priorities, all 6 statuses covered |
| `role_requests` | 2 | One `PENDING`, one `APPROVED` |
| `activity_events` | 3 | `ROLE_REQUEST_CREATED`, `ROLE_REQUEST_APPROVED`, `USER_ROLE_CHANGED` |

### Seeder flags

```bash
# Seed (no-op if users already exist)
mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.enabled=true"

# Wipe everything and re-seed from scratch
mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.enabled=true --app.seed.reset=true"
```

Or set in `application.properties`:

```properties
app.seed.enabled=true
app.seed.reset=false
```

---

## Configuration Reference

All config lives in `server/src/main/resources/application.properties` and `server/.env`.

| Property | Default | Description |
|---|---|---|
| `server.port` | `8081` | HTTP port |
| `spring.data.mongodb.uri` | from `MONGODB_URI` env | SRV connection string |
| `spring.data.mongodb.database` | from `MONGODB_DATABASE` env, fallback `paf_auth` | Database name |
| `spring.data.mongodb.auto-index-creation` | `false` | Indexes are managed in code |
| `auth.google.client-id` | from `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `auth.linkedin.*` | env vars | LinkedIn OAuth (optional) |
| `auth.github.*` | env vars | GitHub OAuth (optional) |
| `server.servlet.session.timeout` | `30m` | Session lifetime |
| `server.servlet.session.cookie.name` | `PAFSESSIONID` | Session cookie name |
| `server.servlet.session.cookie.http-only` | `true` | Block JS access to cookie |
| `server.servlet.session.cookie.same-site` | `lax` | CSRF posture |
| `app.seed.enabled` | `false` | Enable demo seeder |
| `app.seed.reset` | `false` | Wipe & re-seed when starting |

---

## REST API Surface

All endpoints are rooted at `/api`. Authenticated endpoints require a valid `PAFSESSIONID` cookie.

### Auth (`/api/auth`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/config` | public | Public OAuth client IDs |
| `POST` | `/signup` | public | Local sign-up |
| `POST` | `/signin` | public | Local sign-in |
| `POST` | `/google` | public | Google ID token sign-in |
| `GET` | `/linkedin/authorize` | public | Start LinkedIn OAuth |
| `GET` | `/linkedin/callback` | public | LinkedIn callback |
| `GET` | `/github/authorize` | public | Start GitHub OAuth |
| `GET` | `/github/callback` | public | GitHub callback |
| `GET` | `/me` | session | Current user |
| `GET` | `/profile` | session | Current user profile |
| `POST` | `/signout` | session | End session |

### Users (`/api/users`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/users` | `ADMIN`/`MANAGER` | List users |
| `PATCH` | `/api/users/{id}/role` | `ADMIN` | Change role directly |

### Role Requests (`/api/role-requests`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/my` | session | Current user's requests |
| `POST` | `/` | session | Submit a request |
| `GET` | `/` | `MANAGER`/`ADMIN` | All requests |
| `PATCH` | `/{id}/approve` | `MANAGER`/`ADMIN` | Approve |
| `PATCH` | `/{id}/reject` | `MANAGER`/`ADMIN` | Reject with reason |
| `PATCH` | `/{id}` | session owner | Edit pending request |
| `DELETE` | `/{id}` | session owner or admin | Delete request |
| `GET` | `/stream` | session | SSE live updates |

### Resources (`/api/resources`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/` | `ADMIN`/`MANAGER` | Create resource |
| `GET` | `/` | session | List resources |
| `GET` | `/{id}` | session | Resource detail |
| `PUT` | `/{id}` | `ADMIN`/`MANAGER` | Update resource |
| `DELETE` | `/{id}` | `ADMIN` | Delete resource |
| `PATCH` | `/{id}/status` | `ADMIN` | Activate / out-of-service |
| `POST` | `/{id}/reviews` | session | Add review |
| `DELETE` | `/{id}/reviews/{reviewId}` | session owner or admin | Delete review |

### Bookings (`/api/bookings`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/` | session | Create booking (supports recurrence) |
| `GET` | `/my` | session | Current user's bookings |
| `GET` | `/` | `ADMIN` | All bookings |
| `GET` | `/{id}` | session | Booking detail |
| `PUT` | `/{id}` | session owner | Update booking |
| `PUT` | `/{id}/status` | `ADMIN`/`MANAGER` | Approve/reject/cancel |
| `DELETE` | `/{id}` | session owner | Cancel booking |

### Tickets (`/api`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/tickets/meta` | session | Status/priority/type reference data |
| `GET` | `/tickets` | session | List + filter tickets |
| `POST` | `/tickets` | session | Create ticket |
| `GET` | `/tickets/{ticketId}` | session | Ticket detail |
| `PUT` | `/tickets/{ticketId}` | session | Update ticket |
| `PUT` | `/tickets/{ticketId}/edit` | session | Edit ticket (alt verb) |
| `PATCH` | `/tickets/{ticketId}/assign` | `MANAGER`/`ADMIN`/`TECHNICIAN` | Assign technician |
| `POST` | `/tickets/{ticketId}/comments` | session | Add comment |
| `POST` | `/tickets/{ticketId}/attachments` | session | Add attachment |
| `DELETE` | `/tickets/{ticketId}` | session | Soft delete |
| `GET` | `/dashboard` | session | Dashboard summary |
| `GET` | `/reports` | `MANAGER`/`ADMIN` | Reports + SLA buckets |

### Activity (`/api/activity`)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/notifications` | session | Current user's notifications |
| `POST` | `/notifications/mark-read` | session | Mark notifications read |
| `GET` | `/audit` | `ADMIN` | Full audit log |

---

## Project Structure

```
PAF/
├── client/                    # Vue 3 + Vite SPA
├── server/                    # Spring Boot backend
│   ├── src/main/java/com/server/server/
│   │   ├── ServerApplication.java
│   │   ├── activity/          # Activity feed + audit log
│   │   ├── auth/              # Sign-in, OAuth, sessions
│   │   ├── booking/           # Resource bookings
│   │   ├── common/            # Cross-cutting (exception handler)
│   │   ├── config/            # Security + seed config
│   │   │   └── seed/          # Demo data seeder
│   │   ├── resource/          # Resources + reviews
│   │   ├── ticketing/         # Maintenance + incident tickets
│   │   └── user/              # Users + role requests
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── src/test/              # Spring Boot tests
│   ├── .env                   # Local secrets (gitignored)
│   ├── .env.example           # Template (committed)
│   └── pom.xml
├── ticketing-api/             # Optional Node/Express dashboard aggregator
├── docs/                      # Architecture & module guides
├── TICKETING_SYSTEM_GUIDE.md
└── README.md                  # ← you are here
```

---

## Troubleshooting

### `IllegalArgumentException: The connection string is invalid. Connection strings must start with either 'mongodb://' or 'mongodb+srv://'`

Your `MONGODB_URI` placeholder is malformed. The placeholder must follow the pattern `${MONGODB_URI:default-value}` — never put the scheme itself inside `${...}`. See `server/src/main/resources/application.properties` line 4 for the correct form.

### `MongoSocketOpenException` / `MongoTimeoutException` on first request

The app starts but the first DB call fails. Usually one of:

1. **Atlas IP allow-list.** Security → Network Access must include your IP (or `0.0.0.0/0` for dev).
2. **Wrong cluster hostname.** Run `dig _mongodb._tcp.cluster0.YOURID.mongodb.net SRV +short` — if empty, the cluster is gone.
3. **Wrong password.** Rotate in Atlas → Database Access, then update `MONGODB_URI`.

### `Web server failed to start. Port 8081 was already in use`

Another process owns the port:

```bash
lsof -i :8081
kill <PID>
```

Or change `server.port` in `application.properties`.

### `MongoDB connection is unavailable. Check MONGODB_URI or MONGODB_PASSWORD.` (HTTP 503)

Returned by `ApiExceptionHandler` when any DB call raises `DataAccessException`. The app is running but cannot reach MongoDB. See the three causes above.

### OAuth callback returns to a blank page

Make sure `auth.google.client-id`, `auth.linkedin.client-redirect-uri`, and `auth.github.client-redirect-uri` are set to the URL of your running frontend (default `http://localhost:5173/`) and that the OAuth app in the provider's console has the matching callback URLs registered.

### `.env` file not being picked up

The `spring.config.import=optional:file:./server/.env[.properties]` line uses invalid syntax — the `[.properties]` is treated as part of the filename. The app works because the `application.properties` placeholder has a hardcoded fallback. To load a real `.env`, either:

- Rename `server/.env` → `server/.env.properties` and change the import to `optional:file:./server/.env.properties`, **or**
- Add the [spring-dotenv](https://github.com/paulschwarz/spring-dotenv) library.

---

## Security Notes

- **Demo credentials are public.** This README ships with `Demo@123` as the demo password. Never point this codebase at a production MongoDB without:
  1. Running `mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.enabled=false"` (the default) or deleting the seed files entirely.
  2. Rotating every password in the seeded dataset.
  3. Disabling OAuth for any provider you don't intend to use.
- **Never commit `.env`.** It is gitignored, but be careful with editor backups and shell history.
- **Rotate credentials that have appeared in conversation or git history.** Once a secret has been pasted into a chat, in a screenshot, or in a commit, treat it as compromised.
- **CSRF posture is `SameSite=Lax`.** Acceptable for a same-origin SPA; tighten to `Strict` if your frontend and backend ever live on different registrable domains (and add CSRF tokens accordingly).
- **Sessions default to 30 minutes.** Adjust via `server.servlet.session.timeout`.

---

## License & Credits

Demo project — see commit history for contributors.
