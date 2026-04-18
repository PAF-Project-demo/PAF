# Database Schema

The provided implementation uses MongoDB with Mongoose.

## Users collection

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | Primary key |
| `fullName` | String | Required |
| `email` | String | Required, unique |
| `passwordHash` | String | BCrypt hash |
| `role` | Enum | `USER`, `TECHNICIAN`, `ADMIN` |
| `department` | String | Optional |
| `skills` | String[] | Technician skill tags |
| `isActive` | Boolean | Soft active flag |
| `createdAt` / `updatedAt` | Date | Automatic timestamps |

## Tickets collection

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | Primary key |
| `ticketId` | String | Unique auto-generated business ID like `TCK-20260416-0001` |
| `title` | String | Required |
| `description` | String | Required |
| `type` | Enum | `MAINTENANCE`, `INCIDENT` |
| `priority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `category` | String | Required |
| `status` | Enum | `OPEN`, `IN_PROGRESS`, `ON_HOLD`, `RESOLVED`, `CLOSED`, `CANCELLED` |
| `location` | Object | `building`, `floor`, `room`, `campus`, `note` |
| `reporter` | Embedded object | Snapshot of creator info |
| `assignedTechnician` | Embedded object | Snapshot of assignee info |
| `slaHours` | Number | SLA target in hours |
| `dueAt` | Date | SLA deadline |
| `overdue` | Boolean | Derived from status + due date |
| `resolvedAt` | Date | Optional |
| `closedAt` | Date | Optional |
| `attachments` | Array | File metadata and uploader snapshot |
| `comments` | Array | Message, author snapshot, timestamp |
| `activity` | Array | Audit trail items with action + actor |
| `createdAt` / `updatedAt` | Date | Automatic timestamps |

## Suggested MySQL equivalent

If you prefer MySQL, split the document structure into:

- `users`
- `tickets`
- `ticket_comments`
- `ticket_attachments`
- `ticket_activity`

An example relational schema is included in [mysql-schema.sql](./mysql-schema.sql).
