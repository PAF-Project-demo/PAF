# Maintenance and Incident Ticketing System

This repo now includes a full ticketing module with:

- React pages in `client/src/pages/Tickets`
- Reusable React components in `client/src/components/tickets`
- Shared ticketing state/service/types in `client/src/lib/ticketing`
- A standalone Express + MongoDB backend in `ticketing-api`

## Pages included

- Dashboard: `client/src/pages/Tickets/TicketDashboardPage.tsx`
- Create Ticket: `client/src/pages/Tickets/TicketCreatePage.tsx`
- Ticket List: `client/src/pages/Tickets/TicketListPage.tsx`
- Ticket Details: `client/src/pages/Tickets/TicketDetailsPage.tsx`
- Reports: `client/src/pages/Tickets/TicketReportsPage.tsx`

## Reusable React components

- `TicketStatusBadge`
- `TicketPriorityBadge`
- `TicketSummaryCard`
- `TicketFiltersBar`
- `TicketTable`
- `CommentsPanel`
- `ActivityTimeline`

## Backend API structure

See:

- `ticketing-api/docs/api-routes.md`
- `ticketing-api/docs/database-schema.md`
- `ticketing-api/docs/mysql-schema.sql`

## Sample seed data

- Backend seed source: `ticketing-api/src/data/seedData.js`
- Backend seed command: `npm run seed` inside `ticketing-api`
- Frontend persistent mock seed: `client/src/lib/ticketing/mockData.ts`

## Step-by-step implementation

1. Added a standalone `ticketing-api` Express backend using Mongo-ready Mongoose models for users and tickets.
2. Implemented JWT-based auth endpoints, role-based middleware, CRUD ticket endpoints, assignment, comments, uploads, dashboard aggregation, and reports.
3. Added sample users and seed tickets plus schema documentation for both MongoDB and a MySQL equivalent.
4. Built a shared React ticketing service layer with persistent mock storage so the UI works in this workspace even before the new API is installed and started.
5. Created reusable ticketing components for status, priority, filters, table rendering, comments, and timeline views.
6. Added the five required ticketing pages and wired them into routing and sidebar navigation.
7. Added role-aware route protection so reports are limited to technician/admin users while users can still create and follow their tickets.

## Run order

### Frontend-only mock mode

1. Start the existing React app in `client`.
2. Sign in through the current app flow.
3. Open `/tickets/dashboard`, `/tickets`, or `/tickets/new`.

The React ticketing service defaults to local mock persistence, so create/update/comment flows work immediately.

### Full Express backend mode

1. Open `ticketing-api/.env.example` and create a `.env`.
2. Install dependencies in `ticketing-api` with `npm install`.
3. Start MongoDB or point `MONGODB_URI` at your instance.
4. Run `npm run seed` in `ticketing-api`.
5. Run `npm run dev` in `ticketing-api`.
6. Set `VITE_TICKETING_ENABLE_API=true` and `VITE_TICKETING_API_BASE_URL=http://localhost:4000` for the React client if you want the UI to call the Express API instead of mock storage.

## Current note

The repo already contains a separate Spring backend used by the existing authentication/resource features. The new ticketing backend is intentionally isolated in `ticketing-api` so the requested Node.js + Express stack can coexist without breaking the existing Java services.
