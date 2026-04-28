# ⚽ Football Pitch Booking App (Ghana-Focused MVP)

## 🎯 Goal
Build a simple, mobile-friendly web app that helps pitch owners:
- Avoid double bookings
- Track customers
- Organize bookings

## 👥 Users
### Pitch Owner
- Login
- Manage bookings

### Booker
- No login
- Quick booking

## 🗄️ Database Schema (Prisma)

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())

  pitches   Pitch[]
}

model Pitch {
  id            String   @id @default(uuid())
  ownerId       String
  owner         User     @relation(fields: [ownerId], references: [id])
  name          String
  location      String
  pricePerHour  Float
  openingTime   String
  closingTime   String
  createdAt     DateTime @default(now())

  bookings      Booking[]
}

model Booking {
  id          String   @id @default(uuid())
  pitchId     String
  pitch       Pitch    @relation(fields: [pitchId], references: [id])
  name        String
  phone       String
  date        DateTime
  startTime   String
  endTime     String
  status      BookingStatus @default(CONFIRMED)
  createdAt   DateTime @default(now())
}

enum BookingStatus {
  PENDING
  CONFIRMED
}

## 🔌 API

POST /pitches
POST /bookings
GET /pitches/:id/availability

## ⚠️ Rule
Prevent double booking.

## 🚀 Stack
- Next.js
- NestJS
- PostgreSQL
