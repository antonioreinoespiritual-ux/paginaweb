# Product Strategy Studio

Production-ready SaaS web app for product strategy planning using Next.js 14, Prisma, SQLite, NextAuth, Zustand, TanStack Query, dnd-kit, Recharts, and Tailwind + shadcn-style UI.

## Features

- Project dashboard with create/delete flows
- Strategy canvas sections with drag-and-drop ordering
- Segments, problems, solutions, attributes, differentiation, positioning
- User stories panel
- KPI creation and charting (value vs target)
- Roadmap milestones with timeline-like ordered list and status
- JSON export endpoint per project
- Credentials authentication with NextAuth + Prisma SQLite sessions
- Input validation and sanitization with Zod

## Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS 3, Radix-friendly components
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Backend**: Route Handlers with Prisma ORM
- **Database**: SQLite
- **Auth**: NextAuth Credentials + Prisma Adapter

## Installation

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

Demo credentials:
- Email: `demo@studio.com`
- Password: `password123`

## Database setup

1. Ensure `.env` contains:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="super-secret-change-me"
NEXTAUTH_URL="http://localhost:3000"
```

2. Run migration and seed:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

## Useful scripts

- `npm run dev` - start local development
- `npm run build` - production build
- `npm run lint` - lint checks
- `npm run prisma:migrate` - run prisma migrate dev
- `npm run prisma:seed` - seed database

## Troubleshooting login

- If credential login fails, ensure you ran migrations and seed first:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

- Confirm `.env` has a valid `NEXTAUTH_SECRET` and restart `npm run dev` after any env change.

## API endpoints

- `GET/POST /api/projects`
- `GET/PATCH/DELETE /api/projects/:id`
- `GET /api/projects/:id/export`
- `POST /api/segments`
- `POST /api/problems`
- `POST /api/solutions`
- `POST/PUT /api/kpis`
- `POST /api/milestones`
