# Zevo Backend (Node.js + Express + Prisma)

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# update DATABASE_URL and JWT_SECRET
```

3. Generate Prisma client and migrate:

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

## Demo Login Credentials

- Player
  - Email: `player@zevo.demo`
  - Password: `Player@123`
- Owner
  - Email: `owner@zevo.demo`
  - Password: `Owner@123`

## API Endpoints

- `POST /auth/login`
- `POST /book-turf` (JWT required)
- `GET /available-slots?turfId=<uuid>&date=YYYY-MM-DD`

## Booking Rules Implemented

- Atomic booking via transaction (`Serializable` isolation).
- No overlapping bookings for same turf (`PENDING`/`CONFIRMED`).
- `StartTime` must be in the future.
- `EndTime` must be at least 60 minutes after `StartTime`.
- Wallet payment validation and deduction before confirming booking.
- Owner cannot book a slot on their own turf if a player already holds that time.
