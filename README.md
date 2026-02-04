# Autocitas

MVP plan and initial architecture for a multi-business appointment scheduling platform.

## Scope
- Businesses manage services (duration per service), resources (barbers/doctors), and schedules.
- Customers book appointments with live availability checks.
- SMS reminders (first implementation).
- Colombia time zone as default.

## Project structure (planned)
```
apps/
  frontend/   # Astro + React + Tailwind
  backend/    # NestJS + MongoDB
packages/
  config/     # shared lint/format configs
  ui/         # shared UI components (future)
```

## Next steps
- Implement data models and availability logic in backend.
- Build public booking flow in frontend.
- Add admin panel for services/resources/appointments.

## Dev setup
Prereqs: Node 20+, pnpm 9+

Install:
```
pnpm install
```

Run:
```
pnpm -C apps/frontend dev
pnpm -C apps/backend start:dev
```

Env (backend):
```
MONGODB_URI=mongodb://localhost:27017/autocitas
JWT_SECRET=change_me
```

Seed admin user:
```
node apps/backend/scripts/seed-admin.mjs --email admin@demo.com --password demo123 --businessName "Barberia X" --businessSlug barberia-x
```

Seed platform admin:
```
node apps/backend/scripts/seed-platform-admin.mjs --email platform@autocitas.com --password platform123
```

Admin UI:
```
http://localhost:4321/admin
```
Platform admin can log in without Business ID and select a business inside the Platform tab.
Platform admin can also create owners in the Platform tab.

Public booking:
```
http://localhost:4321/<slug>
```
Example:
```
http://localhost:4321/barberia-x
```

Quality:
```
pnpm lint
pnpm format
```

See `docs/architecture.md` for schema, endpoints, and MVP flow.
