# AssetFlow ERP

AssetFlow ERP is a full-stack asset management system for tracking company inventory, assignments, repairs, vendors, tickets, QR codes, branch-wise operations, audit logs, and reports.

## Project Structure

```text
Assets/
  assetflow-backend/   Express API, Supabase (PostgreSQL) queries, auth, seed data, tests
  assetflow-erp/       React + TypeScript + Vite frontend
  assetflow-backend/
    supabase/
      schema.sql       PostgreSQL schema — run this once in the Supabase SQL Editor
    src/
      config/
        supabase.js    Supabase client singleton
      db/              Query helpers (replaces Mongoose models)
      middleware/
      routes/
      seed.js
```

## Features

### Asset Management

- Create, view, update, delete, import, and export assets.
- Track asset status: available, assigned, maintenance, retired, lost, damaged.
- Store serial number, SKU, purchase date, purchase cost, current value, vendor, warranty, insurance, AMC, branch, location, and description.
- Category-specific specifications for electronics, furniture, vehicles, equipment, tools, and custom fields.
- Asset detail page with QR code, financial details, assignment status, related tickets, and asset history.

### Branch-Wise Control

- Branch field on users, admins, and assets.
- Branch filters in Admin Dashboard, Members, Inventory, Allocations, Reports, and Super Admin admin management.
- Branch-aware asset allocation: assets can be assigned/transferred to members from the same branch.
- Branch values included in member and asset Excel exports/import templates.
- Branch-level reporting and dashboard counts.

### User And Role Management

- Roles: Super Admin, Admin, Member.
- Super Admin can manage admin and super-admin accounts.
- Admin can manage members and asset operations.
- Members can access their assigned assets and tickets.
- User status control: active/inactive.
- Department and branch tracking for users.

### Ticket Management

- Create and manage tickets for issues, maintenance, replacement, damage, and lost assets.
- Ticket statuses: open, assigned, in-progress, pending-approval, on-hold, resolved, closed, reopened.
- Priority levels: low, medium, high, urgent.
- Assign tickets, resolve tickets, and add comments.
- Email-to-ticket helper page for converting pasted service emails into tickets.

### Asset History And Repairs

- Assignment and return events are recorded in asset history.
- Repair entries can include vendor, cost, description, date, and performed-by details.
- Member detail view shows current assets and allocation history.

### Vendors

- Vendor CRUD for supplier records.
- Track vendor email, phone, website, contact person, rating, order count, and status.

### QR Tools

- Generate QR codes for individual assets.
- Bulk QR generation.
- QR scanner page for fast asset lookup.

### Import, Export, And Reports

- Import assets and members from CSV or XLSX.
- Download ready-to-fill Excel templates.
- Export members and assets to Excel with branch-aware filtered output.
- Export reports to CSV.
- Reports include status distribution, category summaries, ticket charts, and inventory tables.

### Security And Audit

- Custom JWT authentication (signed and verified by the Express backend).
- Password hashing with bcrypt.
- Role-based API authorization.
- CORS controls.
- Helmet security headers.
- Rate limiting for API and auth routes.
- Request sanitization and HPP protection.
- Audit logs for login, create, update, delete, assign, return, and failed login activity.
- Failed login tracking by IP address.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Tailwind CSS
- Radix UI / shadcn-style components
- Lucide icons
- ExcelJS for XLSX import/export
- qrcode.react and html5-qrcode
- Recharts

### Backend

- Node.js
- Express
- **Supabase** (PostgreSQL) — via `@supabase/supabase-js`
- JWT (custom — backend issues and verifies its own tokens)
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- Jest and Supertest

### Database

- **Supabase** — hosted PostgreSQL.
- Schema defined in `assetflow-backend/supabase/schema.sql`.
- Tables: `users`, `vendors`, `assets`, `asset_history`, `tickets`, `ticket_comments`, `audit_logs`.
- The frontend does **not** talk directly to Supabase — all data access goes through the Express API.

## Prerequisites

- Node.js 18 or newer
- npm
- A [Supabase](https://supabase.com) project (free tier is sufficient)
- Git

Recommended local ports:

- Backend API: `http://localhost:3001`
- Frontend app: `http://localhost:5173`

## Supabase Project Setup

### 1. Create a project

Go to [https://supabase.com](https://supabase.com), create a new project, and wait for it to be ready.

### 2. Run the schema

In the Supabase dashboard, open **SQL Editor** and run the entire contents of:

```text
assetflow-backend/supabase/schema.sql
```

This creates all tables, enums, indexes, and triggers.

### 3. Collect credentials

Go to **Project Settings → API** and copy:

| Variable | Where to find it |
| --- | --- |
| `SUPABASE_URL` | Project URL (e.g. `https://abcdefgh.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret key — keep this private, **backend only** |

## Fresh Installation

### All Platforms

```bash
# 1. Get the project
git clone <your-repo-url> assetflow
cd assetflow

# 2. Install backend dependencies
cd assetflow-backend
npm install
cp .env.example .env
# → Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

# 3. Install frontend dependencies
cd ../assetflow-erp
npm install
cp .env.example .env
# → Ensure VITE_API_URL=http://localhost:3001/api
```

Node.js 18+ is required. Install it from [https://nodejs.org](https://nodejs.org) or via your platform package manager.

## Environment Configuration

### Backend

Create or edit `assetflow-backend/.env`:

```env
PORT=3001
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
JWT_SECRET=replace_with_at_least_32_random_characters_before_deployment
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
TRUST_PROXY=false
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_MAX=20
JSON_BODY_LIMIT=1mb
```

> **Important**: `SUPABASE_SERVICE_ROLE_KEY` grants full database access. Never commit it or expose it to the frontend.

### Frontend

Create or edit `assetflow-erp/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

The frontend communicates **only** with the Express backend. No Supabase credentials are needed on the frontend.

## Seed Demo Data

After the schema has been applied and `.env` credentials are set:

```bash
cd assetflow-backend
npm run seed
```

This clears existing data and creates sample users, vendors, assets, and tickets.

Demo accounts:

| Email | Role | Password |
| --- | --- | --- |
| `superadmin@assetflow.com` | Super Admin | `password123` |
| `admin@assetflow.com` | Admin | `password123` |
| `member@assetflow.com` | Member | `password123` |
| `sarah@assetflow.com` | Member | `password123` |

## Run The Application

Open two terminals.

Terminal 1 — Backend:

```bash
cd assetflow-backend
npm run dev
```

Backend runs at `http://localhost:3001`. On startup it verifies the Supabase connection.

Terminal 2 — Frontend:

```bash
cd assetflow-erp
npm run dev
```

Frontend runs at `http://localhost:5173`.

Open:

```text
http://localhost:5173
```

## Production Build

```bash
# Build frontend
cd assetflow-erp
npm run build

# Preview production frontend locally
npm run preview
```

For a server deployment, serve `assetflow-erp/dist` with a web server and run the backend with a process manager such as PM2:

```bash
cd assetflow-backend
npm install -g pm2
pm2 start src/index.js --name assetflow-backend
pm2 save
```

In production:

- Set `NODE_ENV=production`.
- Use a strong `JWT_SECRET` (at least 32 random characters).
- Set `CLIENT_URL` to the deployed frontend URL.
- Use your Supabase project URL and service role key — never a local database.
- Configure HTTPS and reverse proxy headers correctly.
- Set `TRUST_PROXY=true` if behind a reverse proxy (e.g. nginx, Caddy, Railway).

## Useful Scripts

Backend:

```bash
cd assetflow-backend
npm run dev      # start API with nodemon (hot-reload)
npm start        # start API with node
npm run seed     # reset and seed demo data into Supabase
npm test         # run Jest/Supertest integration tests
```

Frontend:

```bash
cd assetflow-erp
npm run dev      # start Vite dev server
npm run build    # TypeScript check and production build
npm run preview  # preview production build
npm run lint     # run ESLint
```

## Database Schema

The full schema is in `assetflow-backend/supabase/schema.sql`. Key tables:

| Table | Description |
| --- | --- |
| `users` | User accounts with role, branch, department, and bcrypt password hash |
| `vendors` | Supplier records |
| `assets` | Company assets with full lifecycle tracking; `specs` stored as JSONB |
| `asset_history` | Assignment, return, and repair events per asset |
| `tickets` | Support and maintenance tickets |
| `ticket_comments` | Comments on tickets (normalized from embedded sub-documents) |
| `audit_logs` | Full audit trail of all create, update, delete, login, and assign actions |

## API Endpoints

Base URL:

```text
http://localhost:3001/api
```

### Auth

- `POST /auth/login`
- `GET /auth/me`
- `PUT /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/change-password`

### Users

- `GET /users`
- `GET /users/directory`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `PATCH /users/:id/toggle-status`

### Assets

- `GET /assets`
- `GET /assets/:id`
- `POST /assets`
- `PUT /assets/:id`
- `DELETE /assets/:id`
- `POST /assets/:id/assign`
- `POST /assets/:id/return`

### Asset History

- `GET /asset-history/:assetId`
- `GET /asset-history/user/:userId`
- `POST /asset-history/:assetId/repair`

### Tickets

- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets`
- `PUT /tickets/:id`
- `DELETE /tickets/:id`
- `POST /tickets/:id/assign`
- `POST /tickets/:id/resolve`
- `POST /tickets/:id/comments`

### Vendors

- `GET /vendors`
- `POST /vendors`
- `PUT /vendors/:id`
- `DELETE /vendors/:id`

### Logs

- `GET /logs`
- `GET /logs/dashboard-summary`

### Health

- `GET /health`

## Troubleshooting

### Backend fails to start — Supabase connection error

- Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `assetflow-backend/.env`.
- Confirm the Supabase project is active (not paused — free projects pause after 1 week of inactivity).
- Confirm the schema has been applied (run `supabase/schema.sql` in the SQL Editor).
- Check the Supabase dashboard → **Logs → API** for request errors.

### Schema errors when running schema.sql

- If you see `type already exists`, the schema was partially applied previously. Drop all types and tables first or run the script on a fresh database.
- Run the full `schema.sql` in a single execution in the Supabase SQL Editor.

### Port already in use

Linux/macOS:

```bash
lsof -i :3001
kill -9 <PID>
```

Windows:

```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Frontend cannot connect to backend

- Confirm backend is running on `http://localhost:3001`.
- Confirm `assetflow-erp/.env` has `VITE_API_URL=http://localhost:3001/api`.
- Restart the Vite dev server after changing `.env`.
- Confirm backend `CLIENT_URL` matches your frontend origin.

### Login does not work after reseeding

Reseeding deletes and recreates all demo users. Log in again with:

```text
admin@assetflow.com / password123
```

### Supabase project is paused (free tier)

Free-tier Supabase projects pause after 1 week of inactivity. Go to the Supabase dashboard and click **Restore project** to wake it.

## License

MIT
