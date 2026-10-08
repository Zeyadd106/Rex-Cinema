# Rex Cinema Tech

Cinema discovery & ticket-booking web app — fully rewritten as a production-ready Next.js application.

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS 4 (`@theme` tokens in `app/globals.css`)
- **i18n:** next-intl — English + Arabic with full RTL (`localePrefix: 'as-needed'`)
- **Motion/Icons:** framer-motion, lucide-react
- **Data:** file-backed JSON store (`data/db.json`, seeded from `data/movies.json`) behind repository modules in `lib/` — swap in a real database without touching the UI

## Features

- **No customer accounts** — browse, book and look up tickets without registering (state persists in `localStorage`)
- **Catalog**: 20 now-showing + 18 coming-soon titles (Egyptian cinema), 3 cinemas × 3 screens (Standard / IMAX / GOLD) with automatic rolling showtimes
- **Booking flow**: Home → Movies → Movie details (showtimes by date) → Book (movie/cinema/date/showtime/seats) → Booking details → Payment → Confirmation (printable e-ticket)
- **Interactive seat map**: live availability, occupied/disabled seats, 10-seat cap, server-side seat re-validation on every booking
- **Pricing**: subtotal / booking fee / tax / total with server-side quoting (`GET /api/quote`)
- **Mock payment**: validated entirely server-side — test card `4242 4242 4242 4242`
- **Booking dashboard**: current draft + recent bookings on the device, no login
- **Admin panel** (`/admin`): stats overview, movie CRUD, showtime CRUD, booking management with status changes, read-only seat inspector
- **Bilingual (EN/AR)** with RTL layouts, locale-aware dates/times/currency
- **SEO/metadata** per page, custom 404/error pages, keyboard focus styles, `prefers-reduced-motion` support, print styles for tickets

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build (also runs TypeScript checks)
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

Configuration: `.env.example` → copy to `.env` (only `NEXT_PUBLIC_SITE_URL` is used, for metadata).

The database `data/db.json` is created and seeded automatically on first run (git-ignored; delete it to re-seed).

## Project structure

```
app/[locale]/          # en/ + ar/ route tree (root layout, RTL, providers)
  (site)/              # public site: home, movies, coming-soon, booking flow, dashboard
  admin/               # admin shell + pages (own layout)
app/api/               # REST route handlers (movies, showtimes, cinemas, seats,
                       # bookings, quote, admin/stats)
components/            # shared UI (Navbar, MovieCard, SeatMap, BookingSummary, …)
components/admin/      # admin-only UI
context/               # BookingContext (draft + recent refs in localStorage)
i18n/                  # next-intl routing/request/navigation config
lib/                   # repository + domain logic (storage, pricing, validation)
messages/              # en.json / ar.json (336 keys, mirrored)
data/                  # movies.json seed, db.json runtime store
public/logo.png        # brand logo (used across the app)
proxy.ts               # next-intl locale middleware
```

## API overview

| Method | Route | Purpose |
| ------ | ----- | ------- |
| GET/POST | `/api/movies` | list/filter, create |
| GET/PUT/DELETE | `/api/movies/[id]` | read, update, delete |
| GET/POST | `/api/showtimes` | list (movie/cinema/date filters), create |
| GET/PUT/DELETE | `/api/showtimes/[id]` | read, update, delete |
| GET | `/api/cinemas` | cinemas + screens |
| GET | `/api/seats` | seat map for a showtime (`?showtimeId=`) or screen (`?hallId=`) |
| GET | `/api/quote` | price quote (`?seats=`) |
| GET/POST | `/api/bookings` | lookup (by reference/search), create (server-validated) |
| GET/PATCH | `/api/bookings/[id]` | read, change status |
| GET | `/api/admin/stats` | admin overview stats |

Errors return `{ message?, errors?: { field: [code] } }`; the client maps codes to translated messages in the `validation.*` namespace.

## Notes / future work

- **Admin auth is not wired up yet** (`admin.authNote` in the UI says so) — hook the `/admin` area to your identity provider when ready.
- Payment is a demo/validation layer; replace `createBooking`'s `payment` handling with a real provider (keep secrets server-side).
- Storage is intentionally isolated behind `lib/store.ts` + repository functions in `lib/*.ts` so a real database can be dropped in later.
