# FuelContract MS — Fuel Contract Management System

A modern, full-stack web application for managing fuel supply contracts, packages, and delivery details.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Microsoft SQL Server (MSSQL) |
| ORM | Prisma |
| Auth | NextAuth.js v4 (Credentials + OAuth) |
| Session | JWT |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |

## Features

- **Dashboard** — Overview with stats, charts, and live activity feed
- **Fuel Contracts** — Full CRUD with expiry tracking and status management
- **Contract Packages** — Each contract supports multiple packages
- **Contract Details** — Each package holds multiple detail records with contract types: `ORIGINAL`, `AMENDMENT`, `RENEWAL`, `ADDENDUM`
- **Activity Trails** — Every action is logged with user, timestamp, IP, and entity info
- **User Management** — Admin-only user listing with access level display
- **Auth** — Credentials login + optional Google & Azure AD OAuth
- **Responsive** — Works on mobile, tablet, and desktop
- **Dark / Light Mode** — Persisted theme toggle
- **Collapsible Sidebar** — Expands/collapses with preference saved to localStorage

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Microsoft SQL Server (local or remote)
- Git

### 2. Clone & Install

```bash
git clone <repo-url>
cd fuel-cms
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
DATABASE_URL="sqlserver://localhost:1433;database=FuelContractDB;user=sa;password=YourPassword;trustServerCertificate=true"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
JWT_SECRET="another-random-secret"

# Optional OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""
```

### 4. Setup Database

```bash
# Push Prisma schema to MSSQL
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with sample data + admin user
npx ts-node prisma/seed.ts
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default login:** `admin` / `admin123`

---

## Database Schema

### `lst_FuelContracts`
Main contract table. Each contract can have multiple packages and details.

### `lst_FuelContractPackages`
Packages belong to a contract. Each package groups related delivery details.

### `lst_FuelContractDetail`
Delivery detail records. Each detail belongs to a contract and optionally a package.
- **ContractType**: `ORIGINAL` | `AMENDMENT` | `RENEWAL` | `ADDENDUM`

### `lst_User`
Application users with username/password auth and access levels.

### `ActivityTrail`
Audit log table — every create, read (view), update, delete, login, logout is recorded.

---

## Project Structure

```
fuel-cms/
├── prisma/
│   ├── schema.prisma        # MSSQL schema
│   └── seed.ts              # Seed data
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # Protected app pages
│   │   │   ├── dashboard/
│   │   │   ├── contracts/
│   │   │   │   └── [id]/    # Contract detail page
│   │   │   ├── packages/
│   │   │   ├── details/
│   │   │   ├── activity/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── api/             # REST API routes
│   │   │   ├── auth/
│   │   │   ├── contracts/
│   │   │   ├── packages/
│   │   │   ├── details/
│   │   │   ├── users/
│   │   │   ├── activity/
│   │   │   └── dashboard/
│   │   └── login/           # Public login page
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, Topbar
│   │   └── ui/              # Shared UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Prisma, auth, utils, activity logger
│   └── types/               # TypeScript types + NextAuth extensions
└── ...config files
```

---

## Access Levels

| Level | Role | Permissions |
|-------|------|------------|
| 1 | Viewer | Read-only access |
| 2 | Editor | Create and update records |
| 3 | Admin | Full access + user management |
| 4 | Super Admin | All permissions |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats & chart data |
| GET/POST | `/api/contracts` | List / create contracts |
| GET/PATCH/DELETE | `/api/contracts/:id` | Get / edit / delete contract |
| GET/POST | `/api/packages` | List / create packages |
| PATCH/DELETE | `/api/packages/:id` | Edit / delete package |
| GET/POST | `/api/details` | List / create details |
| PATCH/DELETE | `/api/details/:id` | Edit / delete detail |
| GET | `/api/activity` | Paginated activity log |
| GET | `/api/users` | List users (admin only) |

---

## Customization

### Adding OAuth Providers
1. Set env vars for Google or Azure AD in `.env`
2. The login page automatically shows OAuth buttons when env vars are present

### Adding More Contract Types
Edit `ContractType` in:
- `src/types/index.ts` → `ContractType` union
- `src/app/(dashboard)/contracts/[id]/page.tsx` → `CONTRACT_TYPES` array
- `src/app/(dashboard)/details/page.tsx` → filter buttons

### Theme Colors
All colors are CSS variables in `src/app/globals.css`. Change `--accent` to retheme the entire UI.

---

## Production Build

```bash
npm run build
npm start
```

For production, make sure:
- `NEXTAUTH_SECRET` is a strong random string (32+ chars)
- `DATABASE_URL` points to your production MSSQL server
- `NEXTAUTH_URL` is set to your public domain
