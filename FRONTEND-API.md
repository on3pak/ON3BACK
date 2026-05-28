# API ON3BACK — Conexión Frontend

## Base URL

```
http://localhost:3000/api
```

Swagger docs: `/api/docs`

## Autenticación JWT

### 1. Login

```
POST /api/auth/login
Body: { "email": "000001@on3.com", "password": "root" }
Respuesta:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "uid": "...", "email": "...", "fullName": "...", "username": "...", "role": "ROOT", "status": "ONLINE", "language": "ES" }
}
```

### 2. Enviar token en requests

Header: `Authorization: Bearer <accessToken>`

### 3. Refresh token

```
POST /api/auth/refresh
Body: { "refreshToken": "eyJ..." }
Respuesta: Mismo formato que login (nuevo accessToken + refreshToken)
```

### 4. Logout

```
POST /api/auth/logout
Authorization: Bearer <accessToken>  ← Requerido
```

Revoca todos los refresh tokens del usuario.

### JWT Payload

`req.user` contiene:
```ts
{
  uid: string,        // AuthUser.id (usar como userId)
  email: string,
  fullName: string,
  username: string,
  role: { name: string },  // "ROOT" | "ADMIN" | "MANAGER" | "USER"
  status: string,
  language: string  // "ES" | "EN"
}
```

- Access token TTL: **15 minutos** (configurable vía `JWT_EXPIRES_IN`)
- Refresh token TTL: **7 días** (configurable vía `JWT_REFRESH_EXPIRES_IN`)
- Inactividad máxima: **30 días** (`JWT_REFRESH_INACTIVITY_DAYS`)

## Jerarquía de Roles

| Rol | Nivel |
|-----|-------|
| ROOT | 4 |
| ADMIN | 3 |
| MANAGER | 2 |
| USER | 1 |

- `@Roles('ROOT', 'ADMIN')` → solo esos roles exactos
- `@MinLevel(2)` → MANAGER o superior

## Formato de Respuesta

### Éxito — Datos directos (sin envoltorio)

### Error
```json
{
  "success": false,
  "statusCode": 401,
  "message": ["Credenciales inválidas"],
  "errors": null,
  "timestamp": "2026-05-28T..."
}
```

## Formato de IDs

| Entidad | Prefijo | Ejemplo |
|---------|---------|---------|
| City | `city-` | `city-1` |
| WorkCenter | `wc-` | `wc-1` |
| Employee | `emp_` | `emp_000001` |
| Vehicle | `veh_v` | `veh_v001` |
| Service | `svc_` | `svc_1` |
| InventoryItem | `inv_` | `inv_000001` |
| AuthUser | UUID v4 | `550e8400-...` |
| Role / Permission | UUID v4 | - |

---

## Endpoints

### Auth (públicos)

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| POST | `/api/auth/login` | — | `{ email, password }` |
| POST | `/api/auth/register` | — | `{ email, username, fullName, password, language? }` |
| POST | `/api/auth/refresh` | — | `{ refreshToken }` |
| POST | `/api/auth/logout` | JWT | — |

### Users (`@MinLevel(2)`, creacion/update/delete: `@Roles('ROOT','ADMIN')`)

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/users` | — | `?search=&role=&status=&cityId=&page=1&limit=10` |
| GET | `/api/users/:id` | — | — |
| POST | `/api/users` | `{ employeeId, roleId? }` | — |
| PATCH | `/api/users/:id` | `{ username?, fullName?, status?, roleId? }` | — |
| DELETE | `/api/users/:id` | — | — |

### Roles (lectura: cualquiera, escritura: solo ROOT)

| Método | Ruta | Body |
|--------|------|------|
| GET | `/api/roles` | — |
| GET | `/api/roles/:id` | — |
| POST | `/api/roles` | `{ name, level, description?, permissionIds? }` |
| PATCH | `/api/roles/:id` | `{ name?, level?, description?, permissionIds? }` |
| DELETE | `/api/roles/:id` | — |

### Audit (`@MinLevel(3)`)

| Método | Ruta | Query |
|--------|------|-------|
| GET | `/api/audit` | `?action=&entity=&userId=&startDate=&endDate=&page=1&limit=20` |
| GET | `/api/audit/entity/:entity/:entityId` | — |

### Cities (lectura: cualquiera, escritura: ROOT)

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/cities` | — | `?page=1&pageSize=10` |
| GET | `/api/cities/:id` | — | — |
| POST | `/api/cities` | `{ name }` | — |
| PATCH | `/api/cities/:id` | `{ name? }` | — |
| DELETE | `/api/cities/:id` | — | — |

### Work Centers (lectura: cualquiera, escritura: ROOT,ADMIN)

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/work-centers` | — | `?cityId=&page=1&pageSize=10` |
| GET | `/api/work-centers/:id` | — | — |
| POST | `/api/work-centers` | `{ name, address, cityId, status? }` | — |
| PATCH | `/api/work-centers/:id` | `{ name?, address?, status? }` | — |
| DELETE | `/api/work-centers/:id` | — | — |

### Employees (lectura: cualquiera, escritura: @MinLevel(2), delete/restore: ROOT,ADMIN)

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/employees` | — | `?search=&cityId=&workCenterId=&statusId=&categoryId=&active=&userIdNull=&page=1&pageSize=10&sort=&order=asc` |
| GET | `/api/employees/:id` | — | — |
| POST | `/api/employees` | `{ name, lastName1, lastName2, phone, categoryId, statusId, workCenterId, shiftId, schedule, startTime, endTime, workDayId, contractTypeId, contractStartDate, personalEmail?, phoneFixed?, iban?, locker?, medicalCheck?, worksHolidays?, irpf?, vacationDays?, ownDays?, accumulatedDays?, excessDays?, vacationMonth?, vacationYear?, contractEndDate? }` | — |
| PATCH | `/api/employees/:id` | (mismos campos que POST, todos opcionales + `active?`) | — |
| DELETE | `/api/employees/:id` | — | — |
| PATCH | `/api/employees/:id/restore` | — | — |

### Vehicles (lectura: cualquiera, escritura: @MinLevel(2))

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/vehicles` | — | `?workCenterId=&status=&page=1&pageSize=10` |
| GET | `/api/vehicles/:id` | — | — |
| POST | `/api/vehicles` | `{ licensePlate, model, brand, vehicleTypeId, vin, registrationDate, itvExpiration, insuranceExpiration, taxExpiration, fuelType, kilometers, workCenterId, assignedEmployeeId?, observations?, status?, lastReviewDate?, nextReviewKilometers? }` | — |
| PATCH | `/api/vehicles/:id` | (mismos campos que POST, todos opcionales) | — |
| DELETE | `/api/vehicles/:id` | — | — |

### Services (lectura: cualquiera, escritura: @MinLevel(2))

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/services` | — | `?workCenterId=&page=1&pageSize=10` |
| GET | `/api/services/:id` | — | — |
| POST | `/api/services` | `{ workCenterId, name, type }` | — |
| PATCH | `/api/services/:id` | `{ name?, type? }` | — |
| DELETE | `/api/services/:id` | — | — |
| PATCH | `/api/services/:id/tasks/:taskId` | `{ status }` | — |

Al crear un Service se generan automáticamente **140 ServiceTasks**.

### Inventory (lectura: cualquiera, escritura: @MinLevel(2))

| Método | Ruta | Body | Query |
|--------|------|------|-------|
| GET | `/api/inventory` | — | `?cityId=&workCenterId=&category=&lowStock=&page=1&pageSize=10` |
| GET | `/api/inventory/:id` | — | — |
| POST | `/api/inventory` | `{ name, category, subtypeId, statusId, quantity, minStock, unit, cityId, workCenterId, location, description?, serialNumber?, assignedTo?, size?, color?, material?, gender?, certification?, safetyStandard?, brand?, model?, expirationDate?, warrantyExpiration?, lastMaintenance?, nextMaintenance?, notes? }` | — |
| PATCH | `/api/inventory/:id` | (mismos campos que POST, todos opcionales) | — |
| DELETE | `/api/inventory/:id` | — | — |

`?lowStock=true` filtra items donde `quantity <= minStock`.

### Lookups (cualquier autenticado)

| Método | Ruta | Query |
|--------|------|-------|
| GET | `/api/lookups/employee-categories` | — |
| GET | `/api/lookups/employee-statuses` | — |
| GET | `/api/lookups/work-days` | — |
| GET | `/api/lookups/shifts` | — |
| GET | `/api/lookups/contract-types` | — |
| GET | `/api/lookups/vehicle-types` | — |
| GET | `/api/lookups/inventory-categories` | — |
| GET | `/api/lookups/inventory-subtypes` | `?category=` |
| GET | `/api/lookups/inventory-statuses` | — |

Todas devuelven `{ id: string, name: string }[]`.

### Dashboard (cualquier autenticado)

| Método | Ruta | Query |
|--------|------|-------|
| GET | `/api/dashboard/summary` | `?cityId=` |
| GET | `/api/dashboard/alerts` | `?cityId=` |

---

## Usuarios de Prueba (Seeds)

| Email | Password | Rol |
|-------|----------|-----|
| `000001@on3.com` | `root` | ROOT |
| `000002@on3.com` | `admin` | ADMIN |
| `000003@on3.com` | `manager` | MANAGER |
| `000004@on3.com` | `user` | USER |

---

## Enums / Constantes

### FuelType
`GASOLINE` | `DIESEL` | `ELECTRIC` | `HYBRID` | `LPG` | `CNG`

### VehicleStatus
`ACTIVE` | `IN_MAINTENANCE` | `OUT_OF_SERVICE` | `RESERVED`

### WorkCenterStatus
`ACTIVE` | `INACTIVE`

### InventoryCategory
`PPE` | `TOOL` | `CLEANING_PRODUCT` | `STATIONERY` | `SIGNALING` | `MAINTENANCE` | `OTHER`

### VacationMonth
Enero a Diciembre (string en español, capitalizado)

### TaskStatus
`PENDING` | `IN_PROGRESS` | `COMPLETED` | `PENDING_REVIEW` (o según servicio)

### UserStatus
`ACTIVE` | `INACTIVE`

### AuthUserStatus
`ONLINE` | `OFFLINE`
