# NestJS Backend

API REST con NestJS, PostgreSQL, Prisma y autenticación JWT.

## Stack Tecnológico

- **Framework:** NestJS 11
- **Base de datos:** PostgreSQL 15
- **ORM:** Prisma 5
- **Lenguaje:** TypeScript
- **Autenticación:** JWT con refresh tokens
- **Documentación:** Swagger
- **Logging:** Winston
- **Tests:** Jest

## Características

- CRUD de usuarios con roles jerárquicos (root > admin > manager > user)
- Autenticación JWT con refresh tokens
- Auditoría de cambios en usuarios y roles
- Seeds automáticos (usuario root, roles, permisos)
- API documentada con Swagger
- Logging centralizado con rotación de archivos

##快速开始

### Prerrequisitos

- Docker y Docker Compose
- Node.js 20+ (para desarrollo local)

### Ejecución con Docker

```bash
docker compose up -d
```

La API estará disponible en:

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs

### Ejecución local

```bash
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

## Configuración

Variables de entorno (ver `.env`):

```env
DATABASE_URL=postgresql://root:password@localhost:5432/app_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

## Usuario inicial

Se crea automáticamente al iniciar:

- **UserID:** `11111`
- **Username:** `root`
- **Contraseña:** `root`

El login se realiza con **userId** y **contraseña**.

## Endpoints principales

| Método | Endpoint           | Descripción       |
| ------ | ------------------ | ----------------- |
| POST   | /api/auth/login    | Iniciar sesión    |
| POST   | /api/auth/register | Registrar usuario |
| POST   | /api/auth/refresh  | Renovar token     |
| POST   | /api/auth/logout   | Cerrar sesión     |
| GET    | /api/users         | Listar usuarios   |
| POST   | /api/users         | Crear usuario     |
| GET    | /api/roles         | Listar roles      |
| GET    | /api/audit         | Ver auditoría     |

## Scripts

```bash
npm run start          # Iniciar producción
npm run start:dev      # Iniciar desarrollo
npm run build          # Compilar
npm run test           # Tests unitarios
npm run test:e2e       # Tests e2e
npm run lint           # Linting
npm run prisma:studio  # Prisma Studio
```

## Docker

```bash
# Desarrollo
docker compose up -d

# Producción
docker compose -f docker-compose.prod.yml up -d

# Build imagen
docker build -t app-backend .
```
