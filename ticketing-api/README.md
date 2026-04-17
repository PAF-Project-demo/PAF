# Maintenance and Incident Ticketing API

Express + MongoDB backend for the PAF ticketing system.

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start MongoDB locally or point `MONGODB_URI` at Atlas.
4. Seed demo users and tickets with `npm run seed`.
5. Start the API with `npm run dev`.

## Demo accounts

- `admin@paf.local` / `Admin123!`
- `tech@paf.local` / `Tech123!`
- `user@paf.local` / `User123!`

## Notes

- Attachments are stored under `uploads/ticketing`.
- JWT bearer authentication is used for the API.
- MongoDB is the implemented datastore, and a MySQL schema is included for teams that prefer relational storage.
