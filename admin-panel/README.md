# Shadows of the Shogun — Admin Panel

A standalone **Next.js 14 (App Router)** LiveOps / admin console for the *Shadows of the Shogun*
backend. Built with TypeScript, Tailwind CSS, shadcn/ui-style primitives, TanStack React Query,
Recharts and a Japanese dark aesthetic (sumi-black surfaces, dark-red `#8B0000` accent, gold ring).

## Features

| Page | Route | Purpose |
| --- | --- | --- |
| Dashboard | `/` | Live KPIs — DAU, revenue, active players, open cases, server health |
| Players | `/players` | Search players by name / id / account |
| Player detail | `/players/[id]` | Profile, settlements, currencies, grant resources/currency, send mail, warn, ban/unban |
| Economy | `/economy` | Tune economy parameters (rates, caps, prices) with change history |
| Events | `/events` | Schedule / view / cancel LiveOps events |
| Seasons | `/seasons` | Season ladder, activate a season |
| Store | `/store` | Catalog products, offers, reward codes, discount campaigns |
| Analytics | `/analytics` | Funnels, DAU, revenue, top events, currency inflation |
| Moderation | `/moderation` | Report queue — resolve, escalate, ban |
| Audit Log | `/audit-log` | Immutable record of every privileged admin action (searchable, paginated) |
| Feature Flags | `/feature-flags` | Toggle systems & control gradual rollouts per environment |
| Login | `/login` | JWT-cookie authentication |

Every page ships with **loading, error and empty** states.

## Getting started

```bash
cd admin-panel
npm install
cp .env.example .env.local   # then edit values
npm run dev                  # http://localhost:3001
```

> The panel runs standalone. It talks to the NestJS backend when reachable and transparently
> falls back to realistic mock data (see `src/lib/mock.ts`) when an endpoint is unavailable, so
> the UI is fully explorable without a running backend.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (port 3001) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Base URL of the backend API (global `/api` prefix) |
| `NEXT_PUBLIC_ADMIN_USER_ID` | `dev-admin` | Admin user id sent with audited mutations |
| `NEXT_PUBLIC_ENV_TIER` | `development` | Environment badge shown in the top bar |

## Architecture

```
src/
├── app/                 # App Router pages (one folder per route)
├── components/
│   ├── ui/              # shadcn/ui-style primitives (button, card, table, dialog, …)
│   ├── shared/          # PageHeader, StatCard, StatusBadge, Loading/Error/Empty states
│   ├── layout/          # Sidebar, TopBar, AppShell, Providers (React Query)
│   ├── players/         # Player search/card + grant/mail/ban modals
│   ├── economy/         # EconomyEditor
│   ├── events/          # EventForm
│   └── analytics/       # FunnelChart
├── lib/
│   ├── api.ts           # Axios client + typed API functions (withFallback → mocks)
│   ├── auth.ts          # JWT cookie helpers (shogun_admin_token)
│   ├── mock.ts          # Realistic mock datasets
│   └── utils.ts         # Formatting helpers (cn, numbers, currency, dates)
└── types/               # Shared TypeScript interfaces + domain constants
```

### Backend integration

The client calls the admin endpoints exposed by `backend/src/admin` (e.g.
`GET /admin/players/lookup`, `POST /admin/players/:id/grant-currency`,
`POST /admin/accounts/:id/ban`, `POST /admin/events/schedule`,
`POST /admin/feature-flags`). Requests attach the JWT from the `shogun_admin_token` cookie via an
Axios interceptor. Endpoints not yet implemented server-side resolve to mock data so the panel
never hard-fails. Every mutating action is audited server-side and surfaced on the Audit Log page.
