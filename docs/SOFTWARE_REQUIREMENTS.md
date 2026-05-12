# XWZ Parking Management System — Software Requirements

## 1. Problem summary

Replace monolithic parking operations with a secure web application: role-based access, parking registration, live availability, session-based billing with tickets and bills, and date-bounded reporting.

## 2. Functional requirements

### 2.1 Identity and access (Task 2)

| ID | Requirement |
|----|----------------|
| FR-A1 | Users register with first name, last name, email, password. New accounts default to **Parking attendant** role. |
| FR-A2 | **Admin** and **Parking attendant** authenticate with email/password; API returns **JWT** for subsequent calls. |
| FR-A3 | JWT is used for **authentication**; role claim is used for **authorization** (admin-only parking CRUD, etc.). |

### 2.2 Parking catalog (Task 3)

| ID | Requirement |
|----|----------------|
| FR-P1 | Admin registers parking with: **code** (unique), **name**, **total spaces**, **location**, **fee per hour**. **Available spaces** initialise to total spaces. |
| FR-P2 | Authenticated attendants (and admins) can **list** parkings with **available spaces** and **fee per hour**. |

### 2.3 Sessions — entry, exit, ticket, bill (Task 4)

| ID | Requirement |
|----|----------------|
| FR-S1 | On **car entry**: record id, plate number, parking code, entry date-time; **exit date-time** null; **charged amount** 0; decrement **available spaces** when entry is accepted. |
| FR-S2 | On entry, system generates a **ticket** (unique ticket number returned to client). |
| FR-S3 | On **car exit**: set exit date-time, compute duration and **total charge** (hourly rate, partial hours rounded up), persist charged amount, return a **bill** payload; increment **available spaces** (capped at total). |
| FR-S4 | Reject entry when no spaces available. |

### 2.4 Reporting (Task 5)

| ID | Requirement |
|----|----------------|
| FR-R1 | Report **outgoing** vehicles: sessions with exit time in `[from, to]`, list with pagination; response includes **sum of charged amounts** in range. |
| FR-R2 | Report **entered** vehicles: sessions whose **entry** time is in `[from, to]`, paginated list. |

### 2.5 Cross-cutting

| ID | Requirement |
|----|----------------|
| FR-X1 | List endpoints return **pagination** metadata (`page`, `limit`, `total`, `totalPages`). |
| FR-X2 | **Activity logs** capture important actions (login, parking CRUD, entry, exit); admins can browse logs with pagination. |
| FR-X3 | Inputs validated; API returns consistent error shape; **CORS** and common HTTP hardening (Helmet, rate limit on auth). |

## 3. Non-functional requirements

- Responsive UI usable on desktop and mobile.
- Backend documented with **Swagger UI**.
- Passwords stored hashed (bcrypt); secrets via environment variables.
- Structured server logging (console) plus persisted audit trail.

## 4. Database and architecture (detailed documentation)

These companion documents are written for **GitHub** and print well as Markdown:

| Document | Contents |
|----------|----------|
| [**DATABASE_DESIGN.md**](./DATABASE_DESIGN.md) | ER diagram (Mermaid), table-by-table reference, indexes, enum `Role`, entry/exit write sequences, links to Prisma files. |
| [**SYSTEM_ARCHITECTURE.md**](./SYSTEM_ARCHITECTURE.md) | Client–API–database view, Express router map, JWT and security, sequence diagram for exit, frontend structure, deployment sketch, Swagger pointer. |

## 5. Data flow (summary)

1. **Signup / login** → JWT stored in `localStorage` → `Authorization: Bearer` on API calls.
2. **Register parking** (admin) → row in `Parking`; attendants use read APIs for availability and fees.
3. **Entry** → validate capacity → create `ParkingSession`, decrement `availableSpaces`, append activity log.
4. **Exit** → compute duration and charge → update session and `availableSpaces`, return bill payload, append activity log.
5. **Reports** → filtered queries over `ParkingSession` (by `entryAt` or `exitAt`); outgoing report includes revenue sum.

For diagrams and component-level detail, see [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

## 6. Forms / UI surfaces (names)

| Form / page | Primary users | Purpose |
|-------------|----------------|---------|
| User registration form | Public | Create attendant account. |
| Login form | Admin, attendant | Obtain JWT. |
| Parking registration form | Admin | Create/update parking lots. |
| Parking directory | Admin, attendant | View availability and fees. |
| Car entry form | Admin, attendant | Register incoming vehicle; show ticket. |
| Car exit form | Admin, attendant | Complete session; show bill. |
| Outgoing report | Admin, attendant | Date range + paginated list + total revenue. |
| Entries report | Admin, attendant | Date range + paginated list. |
| Activity log viewer | Admin | Paginated audit log. |

## 7. Figma mockup (assignment note)

The assignment asks for **one Figma page**: **User registration / signup**. Implementation: the React **Register** screen follows a single-column card layout (logo, fields: first name, last name, email, password, submit, link to login). Export or attach a Figma frame mirroring that layout for submission.

## 8. API surface (reference)

Base path: `/api`. See **Swagger UI** at `/api/docs` when the server is running.
