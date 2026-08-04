# Mukurtham Matrimony — Full-Stack Matrimony Platform

A production-style matrimony web application: Node.js/Express + SQLite backend,
React (Vite) + Tailwind + Framer Motion frontend, with role-based auth
(Regular User / Broker / Admin), broker approval workflow, profile creation
wizard, search/browse, and a full admin control panel.

## What's implemented

- **Auth**: signup/login with HttpOnly cookie + JWT (365-day expiry so sessions
  persist indefinitely until explicit logout), bcrypt password hashing, forgot
  password via OTP.
- **Roles**: Regular User (instant access) vs Broker (blocked until admin
  approval, `broker_profile_limit` enforced, default 50) vs Admin (`/admin`
  only, seeded credentials below).
- **Profiles**: full field set from the spec (posted-by, astrology/Raasi/Star,
  caste, religion, diaspora country priority list, height, photo + horoscope
  upload, About Me with 50-char minimum), multi-step wizard with real-time
  inline validation and format hints, search/filter, edit, delete.
- **Admin panel**: broker approval queue, site settings editor (branding,
  contact, SEO, theme colors), dynamic navigation menu editor.
- **i18n**: English / Tamil toggle, applied across nav, footer, forms.
- **Design**: glassmorphism cards, burgundy/gold theme, Cormorant Garamond +
  Inter + Noto Sans Tamil type, Framer Motion micro-interactions, and a
  lightweight canvas-based "kolam constellation" ambient background as the
  signature visual (a dependency-free stand-in for a Three.js particle field —
  same visual effect, no extra runtime weight).

## Project structure

```
matrimony-app/
├── backend/          Express API + SQLite (better-sqlite3)
│   ├── server.js
│   ├── db.js          schema + seed data (castes, raasis, stars, countries, admin user)
│   ├── routes/         auth.js, profiles.js, admin.js, public.js
│   ├── middleware/auth.js
│   └── uploads/        uploaded photos/horoscopes land here
└── frontend/          React 18 + Vite + Tailwind
    └── src/
        ├── pages/       Landing, Signup, Login, ForgotPassword, BrokerPending,
        │                Dashboard, ProfileWizard, ProfileDetail, Search,
        │                AdminLogin, AdminDashboard
        ├── components/  Navbar, Footer, Layout, ProfileCard, KolamField, Field
        └── context/     AuthContext, I18nContext
```

## Running locally

Requires Node.js 18+.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # edit values if needed
npm start                 # http://localhost:4000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `localhost:4000`, so just
open **http://localhost:5173**.

### Seeded admin login
Go to `http://localhost:5173/admin`:
- Email: `matrimony2026@gmail.com`
- Password: `Matrimony2026`

**Change this password in `backend/db.js`'s seed function (or add an
admin "change password" flow) before any real deployment.**

## Production build (single deployable)

```bash
cd frontend && npm run build      # outputs frontend/dist
cd ../backend && npm start        # Express now also serves frontend/dist
```

Visit `http://localhost:4000` — one server serves both the API and the built
React app.

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `CLIENT_ORIGIN` | Allowed CORS origin for the dev frontend |
| `JWT_SECRET` | **Change this** to a long random string in production |
| `NODE_ENV` | `production` enables secure cookies |

## Notes on scope / what to harden before going live

- **Database**: ships with `better-sqlite3` (zero external services, file at
  `backend/data/matrimony.db`) so the whole app runs anywhere with just
  `npm install`. The schema is plain relational SQL — swapping in
  MySQL/PostgreSQL means replacing `db.js`'s driver (e.g. `mysql2` or `pg`,
  optionally via an ORM like Sequelize/Prisma) and re-running the same DDL.
- **Email**: the forgot-password flow generates a real OTP and stores it
  server-side, but since there's no email provider connected here it returns
  the OTP directly in the API response (clearly marked `demo_otp` in the
  code and UI). Wire up SES/SendGrid/Postmark/etc. in
  `routes/auth.js` to send it for real instead.
- **File uploads**: stored on local disk under `backend/uploads/`. For a real
  deployment behind multiple instances, move this to S3/Cloud Storage.
- **Deployment**: this repo runs as a standard Node process, so it deploys
  cleanly to Render, Railway, Fly.io, a VPS, or Docker. Point their build
  command at `npm install && cd frontend && npm install && npm run build`
  and the run command at `node backend/server.js`, with `backend/data` and
  `backend/uploads` on a persistent volume.
- **Admin credentials**: rotate the seeded password immediately in any
  non-local environment.
