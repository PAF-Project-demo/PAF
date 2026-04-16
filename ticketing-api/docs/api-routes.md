# API Route Structure

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/technicians`

## Tickets

- `GET /api/tickets`
- `GET /api/tickets/meta`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `PATCH /api/tickets/:id/assign`
- `POST /api/tickets/:id/comments`
- `POST /api/tickets/:id/attachments`

## Dashboard and reports

- `GET /api/dashboard`
- `GET /api/reports`

## Recommended query params for `GET /api/tickets`

- `page`
- `limit`
- `search`
- `type`
- `priority`
- `category`
- `status`
- `location`
- `assignedTechnicianId`
- `overdue=true`
