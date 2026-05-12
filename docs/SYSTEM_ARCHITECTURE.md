# System architecture

This document explains **how the XWZ parking system is structured**: major components, how requests flow, and how security is applied. It complements [SOFTWARE_REQUIREMENTS.md](./SOFTWARE_REQUIREMENTS.md) (what the system must do) and [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) (how data is stored).

---

## 1. High-level overview

The system is a **single-repository full-stack application**:

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Client** | React (Vite, TypeScript) | Signup/login, parking admin forms, session entry/exit, reports, activity logs (admin). |
| **API** | Node.js, Express, TypeScript | REST endpoints, JWT validation, business rules, Prisma ORM. |
| **Database** | PostgreSQL | Persistent storage for users, parkings, sessions, and audit logs. |

```mermaid
flowchart TB
  subgraph browser [Browser]
    SPA[React SPA]
  end

  subgraph server [Application server]
    API[Express API]
    PR[Prisma Client]
  end

  subgraph data [Data tier]
    PG[(PostgreSQL)]
  end

  SPA -->|"HTTPS / JSON\nBearer JWT"| API
  API --> PR
  PR --> PG
```

**Development note:** the Vite dev server can **proxy** `/api` to the Express port so the browser treats API calls as same-origin and avoids CORS friction during local work (`frontend/vite.config.ts`).

---

## 2. Logical architecture (backend)

The API is organised as **routers** mounted under `/api`. Cross-cutting behaviour lives in **middleware**.

```mermaid
flowchart LR
  subgraph ingress [Ingress]
    HEL[Helmet]
    CORS[CORS]
    JSON[JSON parser]
    LOG[Morgan HTTP log]
    RL[Rate limit on /auth]
  end

  subgraph core [Application core]
    AUTH_R["/auth"]
    PARK_R["/parkings"]
    SESS_R["/sessions"]
    REP_R["/reports"]
    LOG_R["/logs"]
  end

  subgraph cross [Cross-cutting]
    JWT[JWT verify]
    RBAC[Role checks]
    VAL[Zod validation]
    ERR[Error handler]
  end

  HEL --> CORS --> JSON --> LOG --> RL
  RL --> AUTH_R
  JWT --> PARK_R
  JWT --> SESS_R
  JWT --> REP_R
  JWT --> LOG_R
  VAL --> AUTH_R
  VAL --> PARK_R
  VAL --> SESS_R
  VAL --> REP_R
  RBAC --> PARK_R
  RBAC --> LOG_R
  core --> ERR
```

| Route group | Authentication | Authorization highlights |
|-------------|----------------|---------------------------|
| `/api/auth/register`, `/login` | Public (rate limited) | Registration always creates `PARKING_ATTENDANT`. |
| `/api/auth/me` | JWT required | — |
| `/api/parkings` GET | JWT | Any authenticated user. |
| `/api/parkings` POST/PUT/DELETE | JWT | **Admin** only. |
| `/api/sessions/*` | JWT | Admin and attendant. |
| `/api/reports/*` | JWT | Admin and attendant. |
| `/api/logs` | JWT | **Admin** only. |

---

## 3. Request lifecycle (example: car exit)

```mermaid
sequenceDiagram
  participant U as User browser
  participant A as Express API
  participant P as Prisma
  participant D as PostgreSQL

  U->>A: POST /api/sessions/:id/exit + Authorization Bearer
  A->>A: Verify JWT, load user role
  A->>A: Validate body (Zod)
  A->>P: Load session + parking (transaction)
  P->>D: SELECT ...
  D-->>P: rows
  P-->>A: session
  A->>A: Compute charge, update session, bump availableSpaces
  A->>P: COMMIT transaction
  P->>D: UPDATE ...
  A->>A: Write ActivityLog (async)
  A-->>U: 200 JSON bill + session
```

---

## 4. Frontend architecture

| Area | Implementation |
|------|------------------|
| **Routing** | `react-router-dom`: public routes (`/login`, `/register`), protected shell with sidebar (`Layout`), nested routes for dashboard pages. |
| **Auth state** | `AuthContext`: stores JWT in `localStorage`, attaches `Authorization` header via `apiFetch`. |
| **API access** | Central `apiFetch` helper: normalises errors, supports pagination responses. |
| **UI** | Component-level pages under `frontend/src/pages/`; shared `PaginationBar`, global styles in `styles.css`. |

```mermaid
flowchart TB
  subgraph spa [React SPA]
    R[Router]
    CTX[AuthProvider]
    L[Layout + nav]
    P1[Register / Login]
    P2[Dashboard, Parkings, Sessions, Reports]
    P3[Logs admin only]
  end
  R --> CTX
  CTX --> L
  L --> P2
  L --> P3
  R --> P1
```

---

## 5. Security architecture

| Concern | Mitigation |
|---------|------------|
| **Transport** | Use HTTPS in production; never send JWT in query strings. |
| **Authentication** | Short-lived configurable JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`); bcrypt for passwords. |
| **Authorization** | Role checks on mutating parking routes and log listing. |
| **Abuse** | Rate limiting on `/api/auth`; JSON body size limit; Helmet security headers. |
| **CORS** | Allow-list origin from `FRONTEND_URL`. |
| **Audit** | `ActivityLog` table + HTTP access logs (morgan). |

---

## 6. API documentation

Interactive documentation is served by the backend:

- **Swagger UI:** `{API_BASE}/api/docs` (e.g. `http://localhost:4000/api/docs` when running locally).
- **OpenAPI source:** `backend/openapi.yaml`.

---

## 7. Deployment view (conceptual)

For coursework or small deployments, one VM or PaaS instance can host both processes; production often splits them.

```mermaid
flowchart LR
  subgraph prod [Typical production]
    CDN[Static hosting or CDN]
    API2[Node API behind reverse proxy]
    DB2[(PostgreSQL managed)]
  end
  CDN -->|users| Users
  Users -->|HTTPS API| API2
  API2 --> DB2
```

Environment variables (see `backend/.env.example`) configure database URL, JWT, CORS origin, and port.

---

## 8. Related documents

| Document | Purpose |
|----------|---------|
| [SOFTWARE_REQUIREMENTS.md](./SOFTWARE_REQUIREMENTS.md) | Requirements, forms list, brief data-flow snippet. |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Tables, ER diagram, indexes, write sequences. |
| [../README.md](../README.md) | Clone, migrate, seed, run frontend and backend. |
