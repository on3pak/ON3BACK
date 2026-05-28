# ON3BACK — NestJS Backend

## Stack
NestJS 11, PostgreSQL 15, Prisma 5.22.0 (pinned — newer breaks schema), TypeScript, JWT auth, Winston logging, Jest.

## Dev Commands
| Command | What |
|---|---|
| `npm run start:dev` | ts-node-dev --respawn (auto-reload en cambios) |
| `npm run build` | tsc -p tsconfig.build.json |
| `npm run test` | jest (unit tests in `test/`) |
| `npm run test:e2e` | jest --config ./test/jest-e2e.json |
| `npm run lint` | eslint "src/**/*.ts" --fix |
| `npm run format` | prettier --write "src/**/*.ts" |
| `npm run prisma:generate` | prisma generate (required after schema changes) |
| `npm run prisma:migrate` | prisma migrate dev |
| `npm run prisma:deploy` | prisma migrate deploy (prod) |

Test order: `npm run lint` → `npm run test` → `npm run test:e2e`

## Architecture
- Modules: `src/modules/{auth,users,roles,audit}/` — each has controller, service, dto/
- Globals: `PrismaModule`, `ConfigModule`, `LoggingModule` — no need to import per-feature
- Entry: `src/main.ts` — sets global prefix `api`, ValidationPipe (whitelist, forbidNonWhitelisted, transform), Swagger at `/api/docs`
- Import alias: `@/` → `src/`
- Db connection: `DATABASE_URL` env var (Prisma)

## Auth
- Login uses `email` (not username) + password
- POST `/api/auth/login` → `{ accessToken, refreshToken, user }` — revokes ALL prior refresh tokens
- POST `/api/auth/refresh` → new token pair (old one revoked)
- POST `/api/auth/logout` (JWT required) → revokes all tokens
- Inactivity revoke after `JWT_REFRESH_INACTIVITY_DAYS` (default 30)
- Default root: email=`000001@on3.com`, password=`root`

## Role Hierarchy & Guards
ROOT(4) > ADMIN(3) > MANAGER(2) > USER(1)

- `@Roles('ROOT', 'ADMIN')` — exact role match
- `@MinLevel(2)` — minimum level (checks `ROLE_HIERARCHY` map in `roles.guard.ts`)
- `@UseGuards(JwtAuthGuard, RolesGuard)` — apply both on controllers

## Seeds (run on startup via `SeedsService.onModuleInit`)
- 4 roles (ROOT, ADMIN, MANAGER, USER)
- Root user if not exists
- 9 permissions (users/roles/audit CRUD) — assigned to ADMIN role

## Conventions
- **All user-facing text in Spanish** — logs, errors, validation messages, Swagger docs, exceptions
- Error response shape: `{ success: false, statusCode, message: string[], errors?, timestamp }`
- Commits: semantic (`feat:`, `fix:`, `refactor:`, etc.)
- Branches: `main`, `develop`, `feature/*`, `hotfix/*`, `release/*`

## Testing
- Unit: `test/**/*.spec.ts` — mock PrismaService + CustomLogger
- E2E: `*.e2e-spec.ts` in `test/` — uses supertest, imports AppModule
- E2E test tsconfig includes both `src/` and `test/`

## Docker
- `Dockerfile` uses `node:20-bookworm`, CMD `npm run start:dev` (dev-focused)
- `.dockerignore` skips `.env`, `node_modules`, `dist`, `logs`
- docker-compose.yml en `D:\PROYECTOS\DOCKER\DOCKER-DEV\` (externo al repo)
- Volumen monta `./ON3BACK:/app` (excluye node_modules) — cambios en código se reflejan al instante
- `ts-node-dev --respawn` reinicia el proceso automáticamente al modificar cualquier archivo
- Rebuild de imagen solo necesario cuando cambia `Dockerfile` o dependencias:
  ```
  docker compose build backend
  docker compose up -d backend
  ```

## Key Config (`.env`)
`DATABASE_*` → `DATABASE_URL` for Prisma. Two JWT secrets: `JWT_SECRET` + `JWT_REFRESH_SECRET`.
