# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Turborepo monorepo** for "Dig Duck", a Korean web crawling desktop application that scrapes Naver services (Smart Store, Blog, Cafe) and provides license management functionality. The project consists of a **React + Tauri frontend** and a **Node.js + Fastify backend API**.

## Repository Structure

```
apps/
├── dig-duck/          # React + Tauri desktop application (Korean UI)
└── api/               # Node.js + Fastify backend API
packages/
├── shared/            # Shared TypeScript types and utilities
├── typescript-config/ # Shared TypeScript configurations
└── eslint-config/     # Shared ESLint configurations
```

## Development Commands

### Root Level Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development servers for all apps
pnpm dev

# Build all applications
pnpm build

# Run linting across all packages
pnpm lint

# Format code with Prettier
pnpm format

# Run type checking
pnpm check-types

# Run lint with auto-fix + format (combined)
pnpm lint:fix

# Run full quality check (lint + type check + format)
pnpm quality
```

### Frontend (dig-duck) Specific Commands

```bash
cd apps/dig-duck

# Development server (web version)
pnpm dev

# Build for web
pnpm build

# Preview production build
pnpm preview

# Run Tauri desktop app in development
pnpm tauri dev

# Build Tauri desktop application
pnpm tauri build
```

### Backend (api) Specific Commands

```bash
cd apps/api

# Development server with hot reload
pnpm dev

# Build TypeScript
pnpm build

# Run production server
pnpm start

# Run tests
pnpm test

# Run specific test file
pnpm test auth.test.ts

# Test coverage report
pnpm test:coverage

# Database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Database studio
pnpm db:studio

# Reset database
pnpm db:reset

# Seed database
pnpm db:seed

# Type checking
pnpm type-check

# Lint TypeScript files
pnpm lint

# Format code
pnpm format
```

## Architecture and Key Technologies

### Frontend (dig-duck)

- **Framework**: React 19 + TypeScript + Vite
- **Desktop**: Tauri (cross-platform native app)
- **Routing**: TanStack Router with type-safe routing
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **HTTP Client**: Axios with custom API client
- **Data Fetching**: TanStack Query

### Backend (api)

- **Runtime**: Node.js 18+ + TypeScript
- **Framework**: Fastify with plugins
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT tokens
- **Web Crawling**: Playwright
- **Email**: Nodemailer
- **Testing**: Vitest
- **Validation**: Zod schemas

### Shared Packages

- **shared**: Common TypeScript types, constants, validation utilities
- **typescript-config**: Shared TypeScript configurations
- **eslint-config**: Shared ESLint rules

## Core Business Logic

### License Management System

- **16-character license keys** with validation
- **Admin vs User roles** (ADMIN-prefixed keys for administrators)
- **Service-specific licenses** (different crawling services)
- **Expiration date management** with automatic checks
- License verification happens on both frontend and backend

### Crawling Engines

The application supports three main crawling types:

1. **Naver Smart Store** - Product information scraping
2. **Naver Blog** - Blog post crawling
3. **Naver Cafe** - Cafe post extraction with category/keyword filtering

### Authentication Flow

1. User enters license key in frontend
2. Frontend validates format and makes API call
3. Backend verifies license against database
4. JWT token issued for authenticated sessions
5. Protected routes check license validity and expiration

## Feature-Based Architecture

### Frontend Structure

```
src/
├── features/
│   ├── license/           # License key input and validation
│   ├── licenseManager/    # Admin license management
│   ├── licenseGenerator/  # Admin license generation
│   ├── crawler/           # All crawling functionality
│   │   ├── naver-blog/    # Blog crawler components
│   │   ├── naver-cafe/    # Cafe crawler components
│   │   └── naver-shopping/ # Shopping crawler components
│   └── admin/             # Admin dashboard
├── components/
│   ├── ui/                # shadcn/ui base components
│   └── layouts/           # Layout components (AdminLayout, UserLayout)
├── lib/                   # Utilities and configurations
└── routes/                # TanStack Router route definitions
    ├── _authenticated/    # Protected routes
    │   ├── admin/         # Admin-only routes
    │   └── crawler/       # Crawler routes
    ├── license.tsx        # License input page
    └── index.tsx          # Root redirect logic
```

### Backend Structure

```
src/
├── controllers/           # API route handlers
├── services/             # Business logic layer
│   └── crawlers/         # Crawler implementations
├── middlewares/          # Authentication, CORS, error handling
├── types/                # TypeScript type definitions
├── plugins/              # Fastify plugins (Prisma, etc.)
└── config/               # Environment and database config
```

## Important Development Notes

### Language and Localization

- **Primary language**: Korean (UI text, comments, variable names often in Korean)
- **Error messages**: Korean language
- **User-facing content**: All in Korean

### Environment Variables

Frontend (.env):

```
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development
```

Backend (.env):

```
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://username:password@localhost:5432/digduck
JWT_SECRET=your-jwt-secret
LICENSE_SALT=your-license-salt
```

### Database

- Uses **PostgreSQL** with **Prisma ORM**
- Migrations in `apps/api/prisma/migrations/`
- Schema defined in `apps/api/prisma/schema.prisma`

### Key Conventions

- **Functional React components** with hooks
- **TypeScript strict mode** enabled
- **Feature-based folder organization**
- **Shared types** in packages/shared
- **Route-based code splitting** with TanStack Router
- **Zod validation** for API requests/responses

### Testing Strategy

- **Backend**: Vitest for unit and integration tests
- **Frontend**: Component testing (when needed)
- **Crawler testing**: Manual testing scripts in `apps/api/src/automation/`

### Deployment

- **Frontend**: AWS S3 + CloudFront (web) / native desktop app
- **Backend**: Docker containers on AWS EC2
- **Database**: PostgreSQL container or managed service
- **CI/CD**: GitHub Actions for automated deployment

## Package Manager

- **Uses pnpm** workspaces for monorepo management
- **Node.js 18+** required
- **Workspace dependencies** linked via `workspace:*` protocol

## Post-Development Tasks

### Code Quality & Formatting

After completing any development task, ALWAYS run the following commands:

**Root level (all packages):**

```bash
# Recommended: Run full quality check (lint + type check + format)
pnpm quality

# Or individually:
pnpm lint
pnpm check-types
pnpm format

# Auto-fix linting issues + format
pnpm lint:fix
```

**For specific apps (if working in one app only):**

```bash
# Frontend
cd apps/dig-duck && pnpm lint

# Backend
cd apps/api && pnpm lint && pnpm type-check
```

### Formatting Guidelines

- **Format only when necessary**: Run `pnpm format` only when code files (.ts, .tsx, .js, .jsx, .md) have been modified
- **Don't format unchanged files**: Skip formatting if no code changes were made
- **Automatic formatting**: Code formatting happens automatically during development workflow when files are edited

## Response Language and Style

- **Default response language**: Korean (한국어)
- All responses should be in Korean unless specifically requested otherwise
- Technical terms may be kept in English when appropriate
- Code comments and documentation should follow existing language patterns

## Communication Style

- **Use compact mode frequently**: Keep responses concise and to the point (1-4 lines)
- Minimize unnecessary explanations and preamble
- Answer the specific task at hand without tangential information
- Prefer direct, actionable responses over verbose explanations
- Only provide detailed explanations when explicitly requested
- Avoid redundant summaries of completed actions
- Focus on what needs to be done, not what was already done

## Import Path Guidelines

- **Always use absolute paths with aliases**: Use `@/` for imports instead of relative paths
- **Prioritize absolute paths**: `import Component from "@/components/Component"` (preferred)
- **Avoid relative paths**: Never use `../../../` or `./` imports
- **Follow path mapping**: Use configured path mappings in tsconfig.json
- **Consistent import order**: External libraries → absolute imports → relative imports (if unavoidable)
- **Use shortest possible absolute path**: Always choose the most direct route to the target file
