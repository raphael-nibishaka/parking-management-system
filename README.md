# XWZ Parking Management System

Full-stack reference implementation for **Tasks 2–5**: JWT authentication with **Admin** and **Parking attendant** roles, parking registration, session entry/exit with tickets and bills, availability updates, paginated reporting, Swagger UI, activity logs, and a responsive **React** SPA.

## Repository layout

| Path | Description |
|------|-------------|
| `docs/README.md` | Short index of all documentation files in this folder. |
| `docs/DATABASE_DESIGN.md` | **Database design:** ER diagram, tables, columns, indexes, write sequences. |
| `docs/SYSTEM_ARCHITECTURE.md` | **System architecture:** layers, security, diagrams, deployment overview. |
| `backend/` | **Node.js + Express + TypeScript + Prisma (PostgreSQL)** REST API. |
| `frontend/` | **React + Vite + TypeScript** SPA. |

### Documentation

- [Software requirements](docs/SOFTWARE_REQUIREMENTS.md) — what the system must do.  
- [Database design](docs/DATABASE_DESIGN.md) — ER model, tables, and persistence details.  
- [System architecture](docs/SYSTEM_ARCHITECTURE.md) — components, security, and request flows.

## Prerequisites

- **Node.js** 20+ recommended  
- **npm** 10+
- **PostgreSQL** 14+ (local install, Docker, or a hosted instance)

## PostgreSQL setup

Create an empty database (example name `xwz_parking`), then set `DATABASE_URL` in `backend/.env` (see `backend/.env.example`):

```text
postgresql://USER:PASSWORD@HOST:5432/xwz_parking?schema=public
```

Quick **Docker** example:

```powershell
docker run --name xwz-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=xwz_parking -p 5432:5432 -d postgres:16
```

Then use: `postgresql://postgres:postgres@localhost:5432/xwz_parking?schema=public`

## Backend

```powershell
cd backend
copy .env.example .env
# Edit .env: set DATABASE_URL to your PostgreSQL connection string
npm install
npx prisma migrate deploy
# For local development you can use instead:
# npx prisma migrate dev
npm run db:seed
npm run dev
```

- API base: `http://localhost:4000/api`  
- **Swagger UI:** `http://localhost:4000/api/docs`  
- Default **admin** (change in production): `admin@xwz.rw` / `Admin123!`  
  - Override seed password: `set SEED_ADMIN_PASSWORD=YourStrongPassword` then `npm run db:seed`  
- Set `JWT_SECRET` to a long random string before deployment.  
- CORS allows the origin in `FRONTEND_URL` (default `http://localhost:5173`).

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server **proxies** `/api` to `http://localhost:4000`, so the SPA can call the API without browser CORS issues during development.

For production builds, set `VITE_API_URL` to the public API origin (for example `https://api.example.com`) so the browser calls the correct host.

## Figma (assignment)

Implement **one** signup screen in Figma that mirrors the **Register** page (`/register`): card layout, fields **first name**, **last name**, **email**, **password**, primary **Sign up** button, and link to login.

## Feature checklist (mapping to brief)

- **Roles:** `ADMIN`, `PARKING_ATTENDANT` (new registrations default to attendant).  
- **Auth:** JWT access token, `Authorization: Bearer`, role checks on admin-only routes.  
- **Parking:** code, name, total spaces, location, fee/hour; `availableSpaces` initialised to total.  
- **Attendant view:** directory lists **available** spaces and **fee/hour**.  
- **Sessions:** entry creates ticket, `exitAt` null and `chargedAmount` 0; exit sets times and charge (hours rounded up), returns **bill** JSON; spaces increment/decrement safely.  
- **Reports:** outgoing between `from`/`to` (by **exit** time) with **sum** of charges; entries between `from`/`to` (by **entry** time).  
- **Pagination:** list endpoints return `meta.page`, `meta.totalPages`, etc.  
- **Logs:** `GET /api/logs` (admin) with pagination; HTTP access log via **morgan**.  
- **Security:** Helmet, strict CORS, JSON size limit, rate limit on `/api/auth`, input validation (Zod), structured errors.

## License

Sample academic / portfolio use unless your institution specifies otherwise.
