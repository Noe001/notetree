# Agent Guide for Notetree

## Commands
- **Frontend (Next.js)**: `cd frontend && npm run dev` (dev), `npm run build` (build), `npm run lint` (lint)
- **Backend (NestJS)**: `cd backend && npm run start:dev` (dev), `npm run build` (build), `npm run lint` (lint), `npm run format` (format)
- **Tests**: `cd backend && npm test` (all), `npm run test:watch` (watch), `npm run test:e2e` (e2e), `npm run test:cov` (coverage)
- **Single test**: `cd backend && npm test -- --testNamePattern="test name"` or `npm test path/to/test.spec.ts`
- **Docker**: `docker-compose up` (full stack), `docker-compose up frontend backend` (app only)
- **Database**: PostgreSQL via Supabase, migrations in `supabase/migrations/`

## Architecture
- **Frontend**: Next.js 15+ with TypeScript, TailwindCSS, shadcn/ui components in `components/ui/`
- **Backend**: NestJS with TypeScript, REST API on port 3000
- **Database**: PostgreSQL via Supabase (port 5432), Kong API Gateway (port 8000), Supabase Auth (GoTrue)
- **Structure**: Monorepo with `frontend/`, `backend/`, `supabase/` directories
- **Features**: Memo app with planned group collaboration features (see memo_app_group_feature_spec.md)

## Code Style
- **TypeScript**: Strict mode disabled, ES2023 target for backend, ES2017 for frontend
- **Prettier**: Single quotes, trailing commas (backend: `.prettierrc`)
- **ESLint**: TypeScript ESLint with Prettier integration, `@typescript-eslint/no-explicit-any` disabled
- **Imports**: Use `@/` prefix for frontend absolute imports from root
- **Components**: React functional components with TypeScript, shadcn/ui patterns
- **API**: NestJS decorators, DTOs for validation, services for business logic
- **Database**: Supabase client, SQL migrations for schema changes
