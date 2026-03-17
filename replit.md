# Raj Hotel Management App

## Overview
A full production-level Hotel Management Mobile App built for "Raj Hotel" using Expo React Native, Node.js + Express backend, PostgreSQL (Neon DB), TanStack React Query, and Cloudinary for image uploads.

## Architecture
- **Frontend**: Expo React Native (Expo Router) — `artifacts/raj-hotel/`
- **Backend**: Node.js + Express API server — `artifacts/api-server/`
- **Database**: PostgreSQL (Neon DB) via Drizzle ORM — `lib/db/`
- **Image Storage**: Cloudinary (via `CLOUDINARY_URL` secret)

## Features
- **Auth**: JWT-based login/register, role-based access (admin/customer)
- **Rooms**: List, search, filter rooms; detailed view with date picker; book rooms with double-booking prevention
- **Bookings**: View all bookings, filter by status (pending/confirmed/rejected), booking detail view
- **Payments**: QR code payment display, screenshot upload for verification, payment status tracking
- **Food Ordering**: Full room service menu, order tracking
- **Admin Panel**: Dashboard with analytics/charts, CRUD rooms with image upload, approve/reject bookings & payments, mark orders as delivered

## Color Theme
- Primary: `#1A3C5E` (Navy Blue)
- Accent: `#C9A84C` (Gold)

## Admin Credentials
- Email: `admin@rajhotel.com`
- Password: `123456`

## Key Files
- `artifacts/raj-hotel/app/_layout.tsx` — Root layout with providers
- `artifacts/raj-hotel/app/(tabs)/_layout.tsx` — Tab layout with auth guard
- `artifacts/raj-hotel/app/(tabs)/index.tsx` — Home screen
- `artifacts/raj-hotel/app/(tabs)/rooms.tsx` — Rooms list
- `artifacts/raj-hotel/app/(tabs)/bookings.tsx` — Bookings list
- `artifacts/raj-hotel/app/(tabs)/food.tsx` — Food ordering
- `artifacts/raj-hotel/app/(tabs)/admin.tsx` — Admin panel
- `artifacts/raj-hotel/app/room/[id].tsx` — Room detail + booking
- `artifacts/raj-hotel/app/booking/[id].tsx` — Booking detail
- `artifacts/raj-hotel/app/payment/[id].tsx` — Payment screen
- `artifacts/raj-hotel/lib/api.ts` — API client + types
- `artifacts/raj-hotel/context/AuthContext.tsx` — Auth state
- `artifacts/api-server/src/routes/` — All API routes
- `lib/db/src/schema/` — Database schema (Drizzle ORM)

## API Endpoints
- `POST /api/auth/login` — Login
- `POST /api/auth/signup` — Register
- `GET /api/auth/me` — Get current user
- `GET /api/rooms` — List rooms
- `POST /api/rooms` — Create room (admin)
- `PUT /api/rooms/:id` — Update room (admin)
- `DELETE /api/rooms/:id` — Delete room (admin)
- `GET /api/bookings` — List bookings (filtered by role)
- `POST /api/book-room` — Create booking
- `PUT /api/bookings/:id` — Update booking status (admin)
- `GET /api/payments` — List payments
- `POST /api/payment` — Submit payment
- `PUT /api/payments/:id` — Update payment status (admin)
- `GET /api/orders` — List orders
- `POST /api/order-food` — Place food order
- `PUT /api/orders/:id` — Update order status (admin)
- `GET /api/analytics` — Get analytics (admin)
- `POST /api/upload-image` — Upload image to Cloudinary

## DB Schema Tables
- `users` — id, name, email, password, role (admin/customer), createdAt
- `rooms` — id, title, description, price, imageUrl, isAvailable, createdAt
- `bookings` — id, userId, roomId, checkIn, checkOut, status (pending/confirmed/rejected), createdAt
- `payments` — id, bookingId, amount, screenshotUrl, status (pending/approved/rejected), createdAt
- `orders` — id, userId, itemName, price, status (pending/delivered), createdAt

## Environment Variables
- `DATABASE_URL` — Neon PostgreSQL connection string (configured)
- `CLOUDINARY_URL` — Cloudinary connection URL (secret, format: cloudinary://api_key:api_secret@cloud_name)
- `SESSION_SECRET` — JWT signing secret (falls back to hardcoded if not set)
