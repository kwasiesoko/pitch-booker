# ⚽ PitchBooker

PitchBooker is a football pitch booking application focused on the Ghanaian market. It helps pitch owners manage bookings and avoid double bookings.

## Project Structure

- **`backend/`**: NestJS application with Prisma ORM.
- **`frontend/`**: Next.js application with Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL

### Backend Setup

1. `cd backend`
2. `npm install`
3. Configure your `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` in `.env`
4. `npx prisma migrate dev` (Once DB is ready)
5. `npm run start:dev`

### Frontend Setup

1. `cd frontend`
2. `npm install`
3. Configure `NEXT_PUBLIC_API_URL` in `.env`
4. `npm run dev`

## Tech Stack

- **Framework**: Next.js (Frontend), NestJS (Backend)
- **ORM**: Prisma 7
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
