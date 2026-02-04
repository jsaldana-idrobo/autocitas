# Architecture Draft

## Core entities (MongoDB)

### Business
Represents a business (barber shop, dentist, etc.) with its public URL slug.

- `_id`
- `name`
- `slug` (unique, used in URL `/[slug]`)
- `timezone` (default `America/Bogota`)
- `contactPhone`
- `address`
- `status` (active/inactive)
- `policies` (subdocument)
  - `cancellationHours`
  - `rescheduleLimit`
  - `allowSameDay`
- `hours` (array)
  - `dayOfWeek` (0-6)
  - `openTime` (e.g. `09:00`)
  - `closeTime` (e.g. `18:00`)
- `createdAt`, `updatedAt`

### Service
Defines a service with duration set by the business.

- `_id`
- `businessId`
- `name`
- `durationMinutes`
- `price` (optional)
- `active`
- `allowedResourceIds` (optional array; empty = any resource)
- `createdAt`, `updatedAt`

### Resource
Represents a staff member (barber/doctor) who can provide services.

- `_id`
- `businessId`
- `name`
- `active`
- `createdAt`, `updatedAt`

### Appointment
A booked appointment with conflict checks on creation.

- `_id`
- `businessId`
- `serviceId`
- `resourceId` (optional; set if user or system assigns)
- `customerName`
- `customerPhone` (identifier)
- `startTime` (ISO, stored in UTC)
- `endTime` (ISO, stored in UTC)
- `status` (`booked`, `cancelled`, `completed`)
- `createdAt`, `updatedAt`

### Block
Represents a time range where scheduling is not allowed.

- `_id`
- `businessId`
- `resourceId` (optional; if missing, applies to all resources)
- `startTime`
- `endTime`
- `reason`
- `createdAt`, `updatedAt`

## Indexing
- `Business.slug` unique index.
- `Appointment` compound index on `businessId`, `startTime`, `endTime`.
- `Appointment` index on `resourceId`, `startTime`, `endTime`.
- `Block` index on `businessId`, `startTime`, `endTime`.

## Availability logic (MVP)
1. Resolve business by `slug` and apply `timezone`.
2. Build candidate slots for requested date based on:
   - business hours for that day
   - service duration
   - resource filtering (if service restricted)
3. Exclude slots with conflicts:
   - overlapping existing appointments
   - overlapping blocks (business-wide or resource-specific)
4. When creating an appointment, repeat the conflict check in a transaction-like flow.

## Endpoints (NestJS)

### Public (customer)
- `GET /public/businesses/:slug`
  - Business detail, services, resources.
- `GET /public/businesses/:slug/availability?date=YYYY-MM-DD&serviceId=...&resourceId?=...`
  - Returns available time slots.
- `POST /public/businesses/:slug/appointments`
  - Body: `{ serviceId, resourceId?, customerName, customerPhone, startTime }`
  - Validates and creates appointment.

### Admin (business)
- `GET /admin/businesses/:businessId/appointments?date=YYYY-MM-DD`
- `POST /admin/businesses/:businessId/services`
- `PATCH /admin/businesses/:businessId/services/:serviceId`
- `POST /admin/businesses/:businessId/resources`
- `POST /admin/businesses/:businessId/blocks`
- `PATCH /admin/businesses/:businessId/policies`

## Notifications (SMS first)
- Scheduler job runs every minute to send reminders for upcoming appointments.
- Provider: Twilio or similar (to be chosen in implementation).
- Template example: "Hola {name}, tienes una cita el {date} a las {time}."

## MVP booking flow (frontend)
1. User enters the business URL (`/barberiaX`).
2. Select service.
3. Select date and time from availability.
4. Enter name + phone.
5. Confirm booking (final availability check).
