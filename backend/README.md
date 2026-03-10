# Zevo Backend - Service-Oriented Architecture

Production-style Node.js + Express backend for turf booking with Prisma ORM, transactional payment confirmation, lock-based slot reservation, and event-driven owner notifications.

## Architecture

```
src/
  app.js
  server.js
  config/
    env.js
  controllers/
    auth.controller.js
    booking.controller.js
  db/
    prisma.js
  events/
    event-bus.js
  middleware/
    auth.middleware.js
    error-handler.middleware.js
    validate.middleware.js
  models/
    user.model.js
    turf.model.js
    booking.model.js
  routes/
    auth.routes.js
    booking.routes.js
  services/
    auth.service.js
    booking-coordinator.service.js
    notification.service.js
  utils/
    errors.js
    time.js
  validators/
    auth.validator.js
    booking.validator.js
```

## Core Domain

- `User` roles: `PLAYER`, `OWNER`, `ADMIN`
- `Wallet`: `walletBalance` in decimal currency
- `Turf`: `pricePerHour`, `location`, `timeZone`, `operatingHours` per weekday JSON
- `Booking` lifecycle: `PENDING -> CONFIRMED -> COMPLETED` or `CANCELLED`

## Booking Workflow (Unified Coordinator)

Implemented in `services/booking-coordinator.service.js`:

1. `Availability Guard`
- Validates `startTime` and `endTime` as ISO 8601 with timezone.
- Converts and stores all time in UTC.
- Validates booking slot against turf local operating hours (`timeZone` + weekday schedule JSON).
- Prevents overlap with active bookings (`CONFIRMED` + non-expired `PENDING`).

2. `10-Minute Lock`
- `POST /bookings/lock` creates a `PENDING` booking.
- Request payload: `{ "turf_id": "<uuid>", "start_time": "<ISO8601>", "end_time": "<ISO8601>" }`
- Slot lock stored in `lockExpiresAt` (`now + 10 minutes`).
- Expired pending locks are auto-cancelled during conflict checks.

3. `Atomic Payment & Confirmation`
- `POST /bookings/:booking_id/confirm-payment`
- Runs in Prisma DB transaction with `Serializable` isolation and retry on serialization conflict.
- Steps:
  - check lock validity
  - double-booking re-check
  - user overlap re-check
  - wallet balance check
  - wallet decrement
  - booking status update to `CONFIRMED`
- Any failure rolls back everything.

4. `Owner Notification`
- Emits `BOOKING_CONFIRMED` event via in-process event bus.
- Notification service sends mock log or webhook (`OWNER_NOTIFICATION_WEBHOOK_URL`).

## Real-World Safety Implemented

- Double-booking protection at initiation and payment stages.
- User conflict guard (cannot have overlapping confirmed bookings across different turfs).
- UTC-safe storage + timezone-local operating-hour validation.
- Request validation using Zod for body/query/params.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed demo data:

```bash
npm run prisma:seed
```

5. Start server:

```bash
npm run dev
```

## Frontend Environment

Set this in frontend `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## API Endpoints

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me` (JWT)

### Turf
- `GET /turfs`

### Booking Lifecycle
- `POST /bookings/lock` (JWT)
- `POST /bookings/:booking_id/confirm-payment` (JWT)
- `POST /bookings/:booking_id/complete` (JWT, owner/admin)
- `POST /bookings/:booking_id/cancel` (JWT, owner/user/admin)
- `GET /bookings/available-slots?turf_id=<uuid>&date=YYYY-MM-DD&slotMinutes=60`

### Backward-Compatible Aliases
- `POST /book-turf` (JWT, same as lock)
- `GET /available-slots?turf_id=<uuid>&date=YYYY-MM-DD` (same as booking availability)

## Demo Credentials

- Player
  - Email: `player@zevo.demo`
  - Password: `Player@123`
- Owner
  - Email: `owner@zevo.demo`
  - Password: `Owner@123`
- Admin
  - Email: `admin@zevo.demo`
  - Password: `Admin@123`
