---
name: nextjs-supabase-graphql-architecture
description: >
  Enforces clean, scalable architecture for Next.js + Supabase + GraphQL projects.
  Use this skill whenever the user is writing, generating, or modifying any code
  in a Next.js codebase that uses Supabase or GraphQL — including creating components,
  hooks, services, API routes, database migrations, or RPC functions. Also trigger
  when the user asks where to put a file, how to structure a feature, or whether
  existing code follows best practices. Even for small one-off code additions, consult
  this skill to ensure correct layer placement and naming.
---

# Next.js + Supabase + GraphQL Architecture Rules

All generated or modified code MUST follow these rules without exception.
Before writing any code, identify the correct layer, folder, and naming pattern below.

---

## Core Principles

**Separation of Concerns** — each layer has one job:
- UI = rendering only
- Hooks = state + orchestration
- Services = data access + mutations
- RPC = database-heavy or atomic logic
- Pages = composition only (thin)

**DRY** — before creating anything, check for existing hooks, services, utils, and components. Never duplicate fetch logic, Supabase queries, validation, types, or UI patterns. Extract shared code into hooks, services, lib utilities, or shared components.

**Feature-first** — all domain logic lives inside `features/`.

---

## Folder Structure

```
src/
  app/              # routes, layouts, pages (thin — composition only)
  components/       # shared composed components
  ui/               # reusable UI primitives (no business logic)
  features/         # domain modules (see Feature Structure below)
  hooks/            # shared reusable hooks
  lib/              # low-level utilities + clients (Supabase, GraphQL)
  services/         # shared services
  schemas/          # Zod validation schemas
  store/            # global state (if needed)
  types/            # global TypeScript types

supabase/
  migrations/       # SQL migrations + RPC function definitions

graphql/
  queries/
  mutations/
  fragments/
  generated/        # auto-generated types from codegen

docs/
```

---

## Feature Structure

Every feature module MUST follow this exact layout:

```
features/<feature-name>/
  components/       # domain-specific UI components
  hooks/            # feature hooks (state + service calls)
  services/         # Supabase / API / GraphQL calls
  graphql/          # feature-scoped queries and mutations
  types/            # feature-scoped TypeScript types
  utils/            # feature-specific pure utilities
  constants/        # feature constants (MAX_LIMIT, statusOptions, etc.)
  index.ts          # controlled public exports only
```

---

## Naming Conventions

| Type | Convention | Examples |
|---|---|---|
| Components | PascalCase | `StudentTable.tsx`, `InvoiceCard.tsx` |
| Hooks | `use` prefix, camelCase | `useStudentList`, `useCreateInvoice` |
| Services | `.service.ts` suffix | `student.service.ts`, `billing.service.ts` |
| Types | PascalCase noun | `Student`, `CreateInvoicePayload` |
| GraphQL files | `<domain>.queries.ts` / `.mutations.ts` | `student.queries.ts` |
| Utils | camelCase, descriptive verb | `formatCurrency.ts`, `mapStudentPayload.ts` |
| Constants | UPPER_SNAKE or camelCase noun | `MAX_LIMIT`, `studentStatuses` |

---

## Layer Responsibilities

### `ui/` — UI Primitives
- Pure, reusable components
- Zero business logic
- No Supabase, no hooks calling services

### `components/` — Shared Composed Components
- Composed from `ui/` primitives
- Reusable across features
- No feature-specific domain logic

### `features/<name>/components/` — Feature Components
- Domain-specific UI
- Uses feature hooks
- Does NOT call services directly

### Hooks
- Manage local and remote state
- Call services — never Supabase directly
- Reusable within the feature or across features
- Must NOT contain unrelated logic or large UI rendering

### Services
- All Supabase / API / GraphQL calls happen here
- Called only from hooks — never from UI or pages
- One concern per service function

### `lib/`
- Supabase and GraphQL client initialization
- Low-level helpers shared everywhere

### `app/` Pages
- Composition only — assemble components
- No business logic
- No direct data fetching (use hooks)

---

## Standard Data Flow

```
UI Component
    ↓
Hook (useXxx)
    ↓
Service (xxx.service.ts)
    ↓
Supabase / API Route / GraphQL / RPC
```

Never skip layers. Never reverse this flow.

---

## Supabase Rules

**Client locations:**
```
lib/supabase/client.ts   # browser client
lib/supabase/server.ts   # server-side client (SSR / Server Components)
```

- NEVER call Supabase directly inside UI components or pages
- ALWAYS go through a service function
- Server components that need data → call a service, not the Supabase client inline

---

## RPC Rules

Use Supabase RPC when:
- Logic involves multiple steps that must be atomic
- Financial calculations, credits, or audit trails
- Complex multi-table logic better handled in SQL

**Placement:**
- SQL definition → `supabase/migrations/`
- Frontend call → service layer only

**Flow:** Component → Hook → Service → RPC (never skip to RPC from UI)

---

## GraphQL Rules

Use GraphQL only when the data source requires it.

- Shared client → `lib/graphql/`
- Feature queries/mutations → `features/<feature>/graphql/`
- NO inline query strings inside components
- Reuse fragments across queries
- Run codegen; import from `graphql/generated/` for types

---

## API Routes Rules

Use `app/api/.../route.ts` when:
- Logic must stay server-only (secrets, external integrations)
- OAuth callbacks, webhook receivers
- Operations that can't use Supabase client-side

**Rules:**
- Keep route handlers thin — validate input, delegate to a service
- Import services; do not write business logic inline in the route handler

---

## Index Files

`index.ts` in each feature = controlled public API. Only export what external code needs.

```ts
// features/billing/index.ts
export * from "./components/InvoiceCard"
export * from "./hooks/useCreateInvoice"
// Do NOT blindly re-export everything
```

---

## Validation

- Use **Zod** for all validation
- Forms → validate with Zod schema before submission
- API route inputs → validate at the route boundary
- Mutation payloads → validate in the service or hook before calling Supabase

Schemas live in:
- `schemas/` for shared schemas
- `features/<feature>/schemas/` for feature-scoped schemas (if not already in `types/`)

---

## Types

- Global types → `types/`
- Feature-scoped types → `features/<feature>/types/`
- Never dump all types into one monolithic file
- Prefer deriving types with `z.infer<typeof MySchema>` from Zod schemas

---

## Coding Style

- Clear, descriptive names over abbreviations
- Small, single-purpose functions
- Early returns to reduce nesting
- Strongly typed — avoid `any`
- Readable over clever
- Minimal comments — code should be self-explanatory

---

## Anti-Patterns — NEVER DO THESE

| Anti-pattern | Correct alternative |
|---|---|
| Direct Supabase call inside a component | Call a service via a hook |
| Giant component with data fetching + rendering | Split into hook + component |
| Giant hook doing fetching + formatting + UI state | Split into service + focused hook |
| Duplicated Supabase query in two places | Extract to a shared service |
| `helpers.ts` or `common.ts` dumping grounds | Named utils in correct folders |
| Business logic inside a page | Move to a hook + service |
| Migration SQL inside a service file | `supabase/migrations/` only |
| Inline GraphQL query string in a component | `features/<feature>/graphql/` file |

---

## Pre-Code Checklist

Before writing any new code, answer these:

1. **What layer is this?** UI / Component / Hook / Service / Lib / Schema / Type / API / GraphQL / Migration
2. **What folder does it belong in?** (see Folder Structure)
3. **Does something equivalent already exist?** Check hooks, services, utils, components — if yes, extend or reuse it
4. **Am I separating UI from logic?** Components render; hooks orchestrate; services fetch
5. **Does the naming follow conventions?** (see Naming Conventions)

---

## Quick Placement Reference

| What you're building | Where it goes |
|---|---|
| Reusable button, input, badge | `ui/` |
| Shared layout or composed component | `components/` |
| Feature-specific UI | `features/<name>/components/` |
| State + data orchestration | `features/<name>/hooks/` or `hooks/` |
| Supabase / API / GraphQL call | `features/<name>/services/` or `services/` |
| Supabase + GraphQL client setup | `lib/` |
| Complex DB transaction | `supabase/migrations/` (SQL) + service (caller) |
| Zod schema | `schemas/` or `features/<name>/` |
| Global TypeScript type | `types/` |
| Feature TypeScript type | `features/<name>/types/` |
| Server-only / external integration | `app/api/.../route.ts` |
| Page composition | `app/<route>/page.tsx` |