# ON3 — Schema Reference (Next.js + PostgreSQL)

> Documento de referencia para implementar el modelo de datos en PostgreSQL,
> los endpoints REST de Next.js, y los contratos de datos para fronts heterogéneos.
> Diseñado para ser interpretado por agentes de IA y desarrolladores.

---

## 1. Convenciones globales

### 1.1 ID Strategy

| Entidad | Formato | Ejemplo | Tipo PG |
|---------|---------|---------|---------|
| `User.id` | UUID v4 | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | `UUID` |
| `AuthUser.id` | UUID v4 | `f6e5d4c3-b2a1-0987-fedc-ba9876543210` | `UUID` (NextAuth) |
| `Employee.id` | `emp_` + 6 dígitos zero-padded | `emp_000001` | `VARCHAR(10)` |
| `City.id` | `city-` + número | `city-1` | `VARCHAR(8)` |
| `WorkCenter.id` | `wc-` + número | `wc-1` | `VARCHAR(6)` |
| `Vehicle.id` | `veh_v` + 3 dígitos | `veh_v001` | `VARCHAR(9)` |
| `Service.id` | `svc_` + número | `svc_1` | `VARCHAR(8)` |
| `InventoryItem.id` | `inv_` + 6 dígitos | `inv_000001` | `VARCHAR(12)` |
| Lookups | prefijo + `-` + número | `ec-1`, `es-1`, `wd-1`, `s-1`, `ct-1`, `vt-1`, `ic-1`, `ist-1`, `rs-1` | `VARCHAR(6)` |

### 1.2 Soft Delete

<!-- @agent: TODAS las entidades de negocio usan soft-delete. Ningún DELETE físico. -->
<!-- @agent: Las queries de listado SIEMPRE filtran WHERE deleted_at IS NULL salvo que se pida explícitamente incluir eliminados. -->
<!-- @agent: Al hacer DELETE, se asigna deleted_at = NOW() y se actualiza deleted_by. -->

Todas las entidades de negocio incluyen estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `created_at` | `string` (ISO 8601) | Fecha de creación |
| `updated_at` | `string` (ISO 8601) | Fecha de última modificación |
| `deleted_at` | `string \| null` (ISO 8601) | Soft delete. `null` = activo |
| `created_by` | `string \| null` | `User.id` que creó el registro |
| `updated_by` | `string \| null` | `User.id` que modificó por última vez |
| `deleted_by` | `string \| null` | `User.id` que eliminó (si aplica) |

### 1.3 Fechas

- Formato: **ISO 8601** (`2025-01-15T08:00:00Z`)
- En PostgreSQL: `TIMESTAMPTZ`
- Siempre en UTC. La conversión a zona horaria local es responsabilidad del frontend.

### 1.4 Naming

- `snake_case` en PostgreSQL (columnas, tablas)
- `camelCase` en TypeScript/API (interfaces, propiedades)
- Tablas en plural: `users`, `employees`, `work_centers`

### 1.5 Indexes sugeridos (globales)

```sql
-- Aplicar a TODAS las tablas con soft-delete
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
-- Aplicar a TODAS las tablas con city_id
CREATE INDEX idx_{table}_city_id ON {table}(city_id);
-- Aplicar a TODAS las tablas con work_center_id
CREATE INDEX idx_{table}_work_center_id ON {table}(work_center_id);
```

---

## 2. Auth Architecture (NextAuth.js)

<!-- @agent: La autenticación la gestiona NextAuth.js v5 (Auth.js). -->
<!-- @agent: AuthUser es la entidad gestionada por NextAuth.js. No se crea ni modifica directamente desde CRUD de negocio. -->
<!-- @agent: User es la entidad de negocio de la aplicación. Se crea desde Employee. -->
<!-- @agent: El enlace entre AuthUser y User es por email. Ambos tienen UUIDs independientes. -->
<!-- @agent: El CRUD de la api opera sobre User. Los cambios en email y datos personales se propagan a AuthUser y Employee. -->

### 2.1 Flujo de autenticación

```
[Frontend] → NextAuth.js signIn() → Provider (Credentials/OAuth)
  → NextAuth crea/actualiza AuthUser (UUID en su tabla interna)
  → Se sincroniza con User.app por email
  → JWT contiene: sub (AuthUser.id), role, city_id
```

### 2.2 Flujo de creación de usuario

```
[Admin] → Selecciona Employee sin user_id (no es usuario del sistema)
  → POST /api/users con employee_id
  → Se crea User (UUID)
  → Se crea AuthUser en NextAuth (UUID) → se envía email de invitación
  → Se asigna Employee.user_id = User.id
  → Sincronización: Employee.email → User.email → AuthUser.email
```

### 2.3 Sincronización por email

<!-- @agent: El email es el único enlace entre AuthUser, User y Employee. -->
<!-- @agent: Si cambia el email de Employee, se propaga a User, y de User a AuthUser. -->
<!-- @agent: Los tres pueden tener soft-delete independiente, pero al borrar Employee se borran User y AuthUser en cascada. -->

```text
Employee.email ──→ User.email ──→ AuthUser.email
emp_000001@on3.com                (NextAuth internal)
```

---

## 3. DB Column Mapping

<!-- @agent: Esta sección mapea tipos TypeScript a tipos PostgreSQL para que un agente pueda generar el schema DDL. -->

### 3.1 Type mapping table

| TypeScript | PostgreSQL | Uso |
|------------|------------|-----|
| `string` (id con prefijo) | `VARCHAR(12)` | IDs tipo `emp_000001`, `wc-1` |
| `string` (UUID) | `UUID` | `User.id`, `AuthUser.id` |
| `string` (email) | `VARCHAR(255)` | Emails |
| `string` (texto corto) | `VARCHAR(100)` | Nombres, descriptiones cortas |
| `string` (texto largo) | `TEXT` | Observaciones, notas |
| `string` (ISO 8601) | `TIMESTAMPTZ` | Fechas |
| `string` (teléfono) | `VARCHAR(20)` | Teléfonos, IBAN |
| `number` (entero) | `INTEGER` | Cantidades, días |
| `number` (decimal) | `NUMERIC(5,2)` | IRPF, porcentajes |
| `boolean` | `BOOLEAN` | Flags activo/inactivo |
| `string \| null` | `VARCHAR(255) NULL` | Campos opcionales |
| `T[]` (array) | `JSONB` | Arrays pequeños o dinámicos |
| enum-like (`'A' \| 'B'`) | `VARCHAR(20)` con CHECK o ENUM PG | Tipos unión |

### 3.2 Índices sugeridos (por entidad)

```sql
-- Índices únicos
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_employees_email ON employees(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_employees_id ON employees(id);
CREATE UNIQUE INDEX idx_vehicles_license_plate ON vehicles(license_plate) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_vehicles_vin ON vehicles(vin) WHERE deleted_at IS NULL;

-- Índices compuestos por city (queries más frecuentes)
CREATE INDEX idx_employees_city_status ON employees(city_id, status_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_city_status ON vehicles(work_center_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_city_stock ON inventory_items(city_id, quantity) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_work_center ON services(work_center_id) WHERE deleted_at IS NULL;

-- Índices de búsqueda (ILIKE)
CREATE INDEX idx_employees_name ON employees USING gin(to_tsvector('spanish', name || ' ' || last_name1 || ' ' || last_name2));
CREATE INDEX idx_vehicles_plate ON vehicles(license_plate);
```

---

## 4. Constraints & Cascades

<!-- @agent: No existen DELETE físicos. Todas las operaciones de borrado son UPDATE set deleted_at = NOW(). -->
<!-- @agent: Las reglas ON DELETE CASCADE que se mencionan son lógicas (soft), no de base de datos. -->

### 4.1 Soft-delete cascade rules

<!-- @agent: Los FK estructurales (user_id, employee_id) NO se setean a NULL en soft-delete. -->
<!-- @agent: Las referencias se mantienen para permitir restore. -->
<!-- @agent: Solo los FK de asignación (assigned_employee_id, assigned_to) se setean a NULL. -->

| Acción | Cascada |
|--------|---------|
| **Borrar Employee** | Si `employee.user_id IS NOT NULL` → marcar `User.deleted_at` + `User.deleted_by` → marcar `AuthUser.deleted_at` (por email). Los FK se mantienen. `Vehicle.assigned_employee_id` y `InventoryItem.assigned_to` pasan a `null`. |
| **Borrar City** | `RESTRICT` si tiene WorkCenters activos. Primero deben reasignarse o borrarse los hijos. |
| **Borrar WorkCenter** | `RESTRICT` si tiene Employees/Vehicles/Services/Inventory activos. |
| **Borrar User** | Marcar `AuthUser.deleted_at` (por email). `Employee.user_id` NO se toca (se mantiene para restore). |
| **Borrar AuthUser** | `RESTRICT`. No se borra desde API de negocio. Solo por cuenta propia desde perfil. |

### 4.2 Unique constraints

| Entidad | Unique key | Nota |
|---------|------------|------|
| `User` | `email` | Sólo activos. Soft-delete permite reusar email tras borrado lógico si la política lo decide. |
| `Employee` | `email`, `id` | El ID `emp_000001` es único por construcción. |
| `Vehicle` | `licensePlate`, `vin` | Matrícula y bastidor. |
| `AuthUser` | `email` | Propio de NextAuth.js. |

### 4.3 Not null constraints

| Entidad | Campo | Regla |
|---------|-------|-------|
| `Employee` | `city_id` | Siempre tiene ciudad asignada (aunque `user_id` sea null). |
| `Vehicle` | `work_center_id` | Todo vehículo pertenece a un centro de trabajo. |
| `InventoryItem` | `city_id` | Siempre scoped por ciudad y centro. |
| `User` | `email` | Siempre tiene email (sync con Employee). |

---

## 5. Enum Reference

<!-- @agent: Estos son los tipos unión de TypeScript. En PostgreSQL pueden implementarse como ENUM o como VARCHAR con CHECK. -->

```typescript
// === Roles ===
export type UserRole = 'ROOT' | 'ADMIN' | 'MANAGER' | 'USER';

// === Vehicle ===
export type VehicleType = 'BARREDORA' | 'CAMION' | 'FURGONETA' | 'TURISMO' | 'PORTER';
export type VehicleStatus = 'ACTIVO' | 'MANTENIMIENTO' | 'AVERIADO' | 'BAJA';
export type FuelType = 'DIESEL' | 'GASOLINA' | 'ELECTRICO' | 'GAS';

// === Service ===
export type TaskStatus = 'PENDING' | 'COMPLETED';

// === Inventory ===
export type InventoryCategory = 'ropa' | 'epi' | 'maquinaria';

// === WorkCenter ===
export type WorkCenterStatus = 'ACTIVE' | 'INACTIVE';
```

```sql
-- PostgreSQL implementation recomendada (VARCHAR + CHECK es portable y fácil de migrar)

CREATE TYPE user_role AS ENUM ('ROOT', 'ADMIN', 'MANAGER', 'USER');
CREATE TYPE vehicle_type AS ENUM ('BARREDORA', 'CAMION', 'FURGONETA', 'TURISMO', 'PORTER');
CREATE TYPE vehicle_status AS ENUM ('ACTIVO', 'MANTENIMIENTO', 'AVERIADO', 'BAJA');
CREATE TYPE fuel_type AS ENUM ('DIESEL', 'GASOLINA', 'ELECTRICO', 'GAS');
CREATE TYPE task_status AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE inventory_category AS ENUM ('ropa', 'epi', 'maquinaria');
CREATE TYPE work_center_status AS ENUM ('ACTIVE', 'INACTIVE');
```

---

## 6. City

<!-- @agent: La City es la raíz organizacional de toda la aplicación. -->
<!-- @agent: Ninguna entidad de negocio existe fuera de una ciudad. -->
<!-- @agent: Es la unidad de aislamiento de datos por defecto. -->

```typescript
export interface City {
  id: string; // city-1, city-2
  name: string; // "Alcalá de Henares", "Guadalajara"
}
```

### Scoping

```text
City
├── WorkCenter (wc-1..wc-21)
│     ├── Employee (emp_000001..emp_000021) — también directo por city_id
│     ├── Vehicle (veh_v001..veh_v010)
│     ├── Service + ServiceTask (svc_1..svc_6)
│     └── InventoryItem (inv_000001..inv_000049)
└── User (UUID) — también por city_id
```

---

## 7. User

<!-- @agent: User es la entidad de negocio. NO se crea nunca suelto — siempre se crea desde un Employee existente. -->
<!-- @agent: El ID es UUID v4. -->
<!-- @agent: El email es el enlace con AuthUser (NextAuth.js) y con Employee. -->

```typescript
export interface User {
  // IDs
  id: string; // UUID v4
  employee_id: string; // emp_000001 → Employee.id. Siempre tiene valor (no existe User sin Employee).

  // Datos personales (sincronizados con Employee)
  username: string; // "m.torres"
  email: string; // "m.torres@on3.com" — unique, enlace con AuthUser y Employee
  full_name: string; // "Miguel Ángel Torres"

  // Roles y permisos
  role: UserRole; // 'ROOT' | 'ADMIN' | 'MANAGER' | 'USER'
  status: 'ACTIVE' | 'INACTIVE';

  // Ciudad
  city_id: string; // city-1 → City.id

  // Audit / Soft delete
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null; // User.id
  updated_by: string | null; // User.id
  deleted_by: string | null; // User.id
}
```

### Reglas user

| Regla | Descripción |
|-------|-------------|
| No existe User sin Employee | Siempre se crea a partir de un Employee seleccionado. |
| Employee puede no tener User | `Employee.user_id === null` significa que no es usuario del sistema. |
| Un Employee tiene como mucho 1 User | `Employee.user_id` apunta a 0 o 1 User. |
| Email sync | `User.email` se sincroniza desde `Employee.email` en creación y actualización. |
| Borrado | Soft delete. Al borrar User, se borra AuthUser. `Employee.user_id` pasa a null. |

---

## 8. AuthUser

<!-- @agent: AuthUser es la entidad gestionada por NextAuth.js (Auth.js). No se crea/manipula directamente. -->
<!-- @agent: Se sincroniza con User por email. -->
<!-- @agent: Cada AuthUser es único por email. -->
<!-- @agent: Su UUID es independiente del UUID de User. -->

```typescript
/**
 * @agent Entidad gestionada por NextAuth.js v5.
 * @agent Se crea automáticamente al hacer signIn/signUp via NextAuth.
 * @agent El CRUD de la aplicación opera sobre User; AuthUser se sincroniza por email.
 * @agent No crear/modificar AuthUser desde endpoints de negocio.
 */
export interface AuthUser {
  id: string; // UUID v4 — generado por NextAuth.js
  email: string; // único. Enlace: User.email === AuthUser.email
  email_confirmed_at: string; // ISO 8601 — cuándo se confirmó el email

  // Metadata
  role: string; // Copia de User.role para tenerlo disponible en sesión

  // Audit / Soft delete (campos añadidos, no nativos de NextAuth)
  deleted_at: string | null;
  deleted_by: string | null; // User.id que provocó el borrado
  created_at: string;
  updated_at: string;
}

/**
 * @agent Shape del JWT generado por NextAuth.js.
 * @agent No es un modelo de DB, es el contrato del token.
 */
export interface JwtPayload {
  sub: string; // AuthUser.id (UUID)
  email: string;
  role: UserRole;
  city_id: string;
  iat: number;
  exp: number;
}
```

### Reglas authuser

| Regla | Descripción |
|-------|-------------|
| No se crea desde API | La creación de AuthUser la hace NextAuth.js al registrar un nuevo usuario (signUp). |
| Soft delete espejo | Si se borra User (soft), se marca AuthUser.deleted_at. El usuario no puede hacer login. |
| Restaurar | Si se restaura User (deleted_at = null), se restaura AuthUser y el usuario puede volver a login. |

---

## 9. Employee

<!-- @agent: Entidad central del personal. Un Employee puede o no ser User del sistema. -->
<!-- @agent: ID formato emp_000001: 6 dígitos zero-padded. -->
<!-- @agent: El email corporativo sigue el patrón {suffix_id}@on3.com (ej: 000001@on3.com). -->
<!-- @agent: Para crear un User, se selecciona un Employee cuyo user_id sea null. -->
<!-- @agent: Todo Employee tiene city_id (nunca null). -->

```typescript
export interface Employee {
  // IDs
  id: string; // emp_000001 — 6 dígitos zero-padded
  user_id: string | null; // UUID → User.id (null = no es usuario del sistema)

  // Datos personales
  name: string;
  lastName1: string;
  lastName2: string;
  email: string; // "000001@on3.com" — unique, coincide con prefijo del ID
  phone: string;
  personal_email: string; // "m.torres@gmail.com"
  phone_fixed: string;
  iban: string;
  locker: string;

  // Scoping
  city_id: string; // city-1 → City.id (nunca null)
  work_center_id: string; // wc-1 → WorkCenter.id
  work_day: string; // wd-1 → WorkDay.id

  // Categoría y estado
  category_id: string; // ec-1 → EmployeeCategory.id
  status_id: string; // es-1 → EmployeeStatus.id
  active: boolean;

  // Horario
  shift: string; // s-1 → Shift.id
  schedule: string; // "08:00-16:00"
  start_time: string; // "08:00"
  end_time: string; // "16:00"

  // Contrato
  contract_type: string; // ct-1 → ContractType.id
  contract_start_date: string;
  contract_end_date: string | null;
  irpf: number;

  // Vacaciones
  vacation_month: VacationMonth | null; // 'julio' | 'agosto' | 'septiembre' | 'partidas'
  vacation_year: number | null;
  vacation_days: number;
  own_days: number;
  accumulated_days: number;
  excess_days: number;

  // Flags
  medical_check: boolean;
  works_holidays: boolean;

  // Audit / Soft delete
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}

export interface EmployeeOverview {
  id: string;
  email: string;
  name: string;
  lastName1: string;
  lastName2: string;
  category_id: string;
  work_day_id: string;
  work_center_id: string;
  status_id: string;
  city_id: string; // Empresarial, nunca null
}
```

### Reglas employee

| Regla | Descripción |
|-------|-------------|
| ID auto-generado | Secuencia `emp_` + 6 dígitos zero-padded. El siguiente sería `emp_000022`. |
| Email derivado | `{digits}@on3.com`. Si el ID es `emp_000001`, el email es `000001@on3.com`. |
| User opcional | `user_id null` = empleado sin acceso al sistema. `user_id set` = es usuario. |
| Borrado en cascada | Si se borra Employee y tiene `user_id`, se borran User y AuthUser (soft). |

---

## 10. WorkCenter

<!-- @agent: Agrupación operativa dentro de una ciudad. -->
<!-- @agent: Es el nivel de scoping para vehículos, empleados, servicios e inventario. -->

```typescript
export interface WorkCenter {
  id: string; // wc-1, wc-2
  name: string; // "Nave", "Puerta Madrid"
  address: string;
  city_id: string; // city-1 → City.id
  status: WorkCenterStatus; // 'ACTIVE' | 'INACTIVE'

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}
```

### Employee → WorkCenter: many-to-one

Cada WorkCenter puede tener muchos Employees, pero cada Employee pertenece a un solo WorkCenter.

### Query pattern

```sql
-- Todos los work centers activos de una ciudad
SELECT * FROM work_centers WHERE city_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL;
```

---

## 11. Vehicle

<!-- @agent: Vehículo operativo asignado a un WorkCenter y opcionalmente a un Employee. -->

```typescript
export interface Vehicle {
  id: string; // veh_v001
  licensePlate: string; // "1234BCD" — unique
  model: string;
  brand: string;
  vehicle_type_id: string; // vt-1 → VehicleTypeOption.id
  status: VehicleStatus; // 'ACTIVO' | 'MANTENIMIENTO' | 'AVERIADO' | 'BAJA'

  // Documentación
  vin: string; // Bastidor — unique
  registration_date: string;
  itv_expiration: string;
  insurance_expiration: string;
  tax_expiration: string;

  // Mantenimiento
  fuel_type: FuelType; // 'DIESEL' | 'GASOLINA' | 'ELECTRICO' | 'GAS'
  kilometers: number;
  last_review_date: string;
  next_review_kilometers: number;

  // Scoping
  work_center_id: string; // wc-1 → WorkCenter.id
  assigned_employee_id: string; // emp_000001 → Employee.id

  observations: string;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}

export interface VehicleOverview {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  vehicle_type_id: string;
  status: VehicleStatus;
  work_center_id: string;
  kilometers: number;
}

export interface VehicleTypeOption {
  id: string; // vt-1
  name: string; // "RAVO"
  type: VehicleType; // 'BARREDORA'
}
```

### Query patterns

```sql
-- Vehículos próximos a ITV (próximos 30 días)
SELECT * FROM vehicles
WHERE itv_expiration BETWEEN NOW() AND NOW() + INTERVAL '30 days'
AND deleted_at IS NULL;

-- Vehículos por work center
SELECT * FROM vehicles WHERE work_center_id = $1 AND deleted_at IS NULL;

-- Vehículos por tipo de combustible
SELECT fuel_type, COUNT(*) FROM vehicles WHERE deleted_at IS NULL GROUP BY fuel_type;
```

---

## 12. Service + ServiceTask

<!-- @agent: Servicio operativo (limpieza, recogida, barrido). -->
<!-- @agent: Cada Service genera N ServiceTask (días × tareas). -->
<!-- @agent: Scoped por WorkCenter. -->

```typescript
export interface Service {
  id: string; // svc_1
  work_center_id: string; // wc-1 → WorkCenter.id
  name: string; // "BMIX1"
  type: string; // "BARRIDO MIXTO", "BALDEO", etc.

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}

export interface ServiceTask {
  id: string; // UUID v4 o serial
  service_id: string; // svc_1 → Service.id
  day_index: number; // 0-6 (día de la semana)
  task_index: number; // 0-19 (orden dentro del día)
  description: string;
  status: TaskStatus; // 'PENDING' | 'COMPLETED'

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ServiceOverview {
  id: string;
  work_center_id: string;
  name: string;
  type: string;
  total_tasks: number;
  completed_tasks: number;
}
```

### Service structure

Cada Service genera 7 días × 20 tareas = 140 ServiceTask.

### Query patterns

```sql
-- Progreso de un servicio
SELECT
  s.*,
  COUNT(st.id) AS total_tasks,
  COUNT(st.id) FILTER (WHERE st.status = 'COMPLETED') AS completed_tasks
FROM services s
LEFT JOIN service_tasks st ON st.service_id = s.id AND st.deleted_at IS NULL
WHERE s.id = $1 AND s.deleted_at IS NULL
GROUP BY s.id;

-- Tasks pendientes de un servicio para hoy
SELECT * FROM service_tasks
WHERE service_id = $1
  AND day_index = EXTRACT(DOW FROM NOW())
  AND status = 'PENDING'
  AND deleted_at IS NULL;
```

---

## 13. Inventory

<!-- @agent: Inventario con 3 categorías: ropa, epi, maquinaria. -->
<!-- @agent: Cada categoría tiene sus propios estados y subtipos. -->
<!-- @agent: Scoped por city + work_center. -->

### 13.1 Types

```typescript
export type InventoryCategory = 'ropa' | 'epi' | 'maquinaria';

export interface InventoryCategoryOption {
  id: string; // ic-1, ic-2, ic-3
  name: string; // "Ropa", "EPIs", "Maquinaria"
  value: InventoryCategory;
}

export interface InventorySubtype {
  id: string; // ist-1..ist-4 (ropa), ist-11..ist-17 (epi), ist-20..ist-27 (maquinaria)
  category: InventoryCategory;
  name: string; // "Pantalón", "Casco", "Sopladora"
}

export interface InventoryStatus {
  id: string; // rs-1..rs-3 (ropa), es-1..es-3 (epi), ms-1..ms-4 (maquinaria)
  name: string; // "Disponible", "Mantenimiento", "Baja"
}
```

### 13.2 Estados por categoría

| Categoría | IDs | Estados |
|-----------|-----|---------|
| **ropa** | `rs-1` a `rs-3` | Disponible, Agotado, En Reposición |
| **epi** | `es-1` a `es-3` | Disponible, Agotado, En Reposición |
| **maquinaria** | `ms-1` a `ms-4` | Disponible, Mantenimiento, Averiado, Baja |

### 13.3 Subtipos por categoría

| Categoría | Subtipos |
|-----------|----------|
| **ropa** | Pantalón, Camisa, Chaqueta, Forro |
| **epi** | Casco, Guantes, Mascarilla, Máscara, Arnés, Protector, Gafas |
| **maquinaria** | Sopladora, Desbrozadora, Cortacésped, Motocultor, Hidrolimpiadora, Barredora, Motosierra, Generador |

### 13.4 InventoryItem

```typescript
export interface InventoryItem {
  id: string; // inv_000001

  // Identificación
  name: string;
  description: string;
  category: InventoryCategory;
  subtype_id: string; // ist-1 → InventorySubtype.id
  status_id: string; // rs-1 → InventoryStatus.id (segun categoria)
  serial_number: string | null;

  // Stock
  quantity: number;
  min_stock: number;
  unit: string; // "unidades", "pares", etc.

  // Scoping
  city_id: string; // city-1 → City.id
  work_center_id: string; // wc-9 → WorkCenter.id
  location: string; // "Estante A-1"
  assigned_to: string | null; // emp_000001 → Employee.id

  // Específicos de ropa
  size: string | null; // "S", "M", "L", "XL", "XXL"
  color: string | null;
  material: string | null;
  gender: string | null;

  // Específicos de EPI / Maquinaria
  certification: string | null;
  safety_standard: string | null;
  brand: string | null;
  model: string | null;

  // Caducidad / Mantenimiento
  expiration_date: string | null;
  warranty_expiration: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;

  // Notas
  notes: string;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}

export interface InventoryOverview {
  id: string;
  name: string;
  category: InventoryCategory;
  subtype_id: string;
  status_id: string;
  quantity: number;
  min_stock: number;
  unit: string;
  city_id: string;
  work_center_id: string;
  location: string;
}
```

### 13.5 Categorización visual

```text
Inventory
├── Ropa (ic-1)
│     ├── Estado: Disponible (rs-1), Agotado (rs-2), En Reposición (rs-3)
│     └── Subtipos: Pantalón, Camisa, Chaqueta, Forro
├── EPI (ic-2)
│     ├── Estado: Disponible (es-1), Agotado (es-2), En Reposición (es-3)
│     └── Subtipos: Casco, Guantes, Mascarilla, Máscara, Arnés, Protector, Gafas
└── Maquinaria (ic-3)
      ├── Estado: Disponible (ms-1), Mantenimiento (ms-2), Averiado (ms-3), Baja (ms-4)
      └── Subtipos: Sopladora, Desbrozadora, Cortacésped, Motocultor, Hidrolimpiadora, Barredora, Motosierra, Generador
```

### Query patterns

```sql
-- Items con stock bajo (quantity < min_stock)
SELECT * FROM inventory_items
WHERE quantity < min_stock AND deleted_at IS NULL
ORDER BY (quantity::float / NULLIF(min_stock, 0)) ASC;

-- Items por ciudad y categoría
SELECT * FROM inventory_items
WHERE city_id = $1 AND category = $2 AND deleted_at IS NULL;

-- Maquinaria próxima a mantenimiento
SELECT * FROM inventory_items
WHERE category = 'maquinaria'
  AND next_maintenance BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND deleted_at IS NULL;
```

---

## 14. Lookup tables

<!-- @agent: Tablas pequeñas de tipo lookup (catalogos). No tienen soft-delete porque son catálogos de referencia. -->
<!-- @agent: Se cachean fácilmente en el frontend y raramente cambian. -->

### 14.1 EmployeeCategory

```typescript
export interface EmployeeCategory { id: string; name: string; }
// ec-1: Peón Limpieza, ec-2: Peón Recogida, ec-3: Oficial, ec-4: Oficial 2ª,
// ec-5: Mantenimiento, ec-6: Mecánico, ec-7: Encargado, ec-8: Encargado General,
// ec-9: Jefe de Servicio, ec-10: Administrativo
```

### 14.2 EmployeeStatus

```typescript
export interface EmployeeStatus { id: string; name: string; }
// es-1: Trabajando, es-2: Descanso, es-3: Baja,
// es-4: Días Propios, es-5: Días Acumulados, es-6: Vacaciones
```

### 14.3 WorkDay

```typescript
export interface WorkDay { id: string; name: string; }
// wd-1: Lunes a Viernes, wd-2: Fin de Semana,
// wd-3: Rotativo 1, wd-4: Rotativo 2
```

### 14.4 Shift

```typescript
export interface Shift { id: string; name: string; }
// s-1: Mañana, s-2: Tarde, s-3: Noche
```

### 14.5 ContractType

```typescript
export interface ContractType { id: string; name: string; }
// ct-1: Indefinido, ct-2: Temporal, ct-3: Obra
```

### 14.6 ServiceType

```typescript
// No tiene interface propia. Es un string libre: 'BARRIDO MIXTO', 'BARRIDO MANUAL',
// 'BARRIDO MECÁNICO', 'BALDEO', 'RECOGIDA', 'VACIADO'
```

---

## 15. DTOs

<!-- @agent: Los DTOs separan el contrato de API del modelo de base de datos. -->
<!-- @agent: CreateDTO → lo que recibe POST/PUT. Response → lo que devuelve la API. -->

### 15.1 Employee

```typescript
export interface CreateEmployeeDTO {
  name: string;
  lastName1: string;
  lastName2: string;
  phone: string;
  category_id: string;
  status_id: string;
  work_center_id: string;
  shift: string;
  schedule: string;
  start_time: string;
  end_time: string;
  work_day: string;
  contract_type: string;
  contract_start_date: string;
  // Opcionales con valor por defecto
  personal_email?: string;
  phone_fixed?: string;
  iban?: string;
  locker?: string;
  medical_check?: boolean;
  works_holidays?: boolean;
  irpf?: number;
  vacation_days?: number;
  own_days?: number;
  accumulated_days?: number;
  excess_days?: number;
  vacation_month?: VacationMonth;
  vacation_year?: number;
  contract_end_date?: string | null;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}

export interface EmployeeResponse extends Employee {}
// EmployeeResponse es idéntico a Employee pero:
// - Calcula email desde ID si no se proveyó explícitamente
// - No expone deleted_at por defecto
```

### 15.2 User (creation from Employee)

```typescript
export interface CreateUserDTO {
  employee_id: string; // emp_000001 → Employee.id (obligatorio)
  // username se genera automáticamente desde Employee.name
  // email se hereda de Employee.email
  // role se asigna por defecto 'USER' o se selecciona
  role?: UserRole;
  // El resto se sincroniza desde Employee
}

export interface UpdateUserDTO {
  full_name?: string;
  role?: UserRole;
  status?: 'ACTIVE' | 'INACTIVE';
  // email NO se actualiza directamente — se sincroniza desde Employee
}

export interface UserResponse {
  id: string;
  employee_id: string; // Siempre tiene valor (no existe User sin Employee)
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  city_id: string;
  created_at: string;
  updated_at: string;
  // No expone deleted_at por defecto
  // No expone datos sensibles de AuthUser
}
```

### 15.3 Vehicle

```typescript
export interface CreateVehicleDTO {
  licensePlate: string;
  model: string;
  brand: string;
  vehicle_type_id: string;
  vin: string;
  registration_date: string;
  itv_expiration: string;
  insurance_expiration: string;
  tax_expiration: string;
  fuel_type: FuelType;
  kilometers: number;
  work_center_id: string;
  assigned_employee_id?: string;
  observations?: string;
  status?: VehicleStatus;
  last_review_date?: string;
  next_review_kilometers?: number;
}

export interface UpdateVehicleDTO extends Partial<CreateVehicleDTO> {}

export interface VehicleResponse extends Vehicle {}
```

### 15.4 Service

```typescript
export interface CreateServiceDTO {
  work_center_id: string;
  name: string;
  type: string;
  // ServiceTask se generan automaticamente (7 days × 20 tasks)
}

export interface UpdateServiceDTO {
  name?: string;
  type?: string;
}

export interface ServiceResponse extends Service {
  total_tasks: number;
  completed_tasks: number;
}

export interface UpdateTaskStatusDTO {
  task_id: string;
  status: TaskStatus;
}
```

### 15.5 Inventory

```typescript
export interface CreateInventoryItemDTO {
  name: string;
  description: string;
  category: InventoryCategory;
  subtype_id: string;
  quantity: number;
  min_stock: number;
  unit: string;
  city_id: string;
  work_center_id: string;
  location: string;
  // Opcionales
  status_id?: string;
  serial_number?: string;
  assigned_to?: string;
  size?: string;
  color?: string;
  material?: string;
  gender?: string;
  certification?: string;
  safety_standard?: string;
  brand?: string;
  model?: string;
  expiration_date?: string;
  warranty_expiration?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
}

export interface UpdateInventoryItemDTO extends Partial<CreateInventoryItemDTO> {}

export interface InventoryItemResponse extends InventoryItem {}
```

---

## 16. Employee → User creation flow

<!-- @agent: Este es el flujo crítico de la aplicación. No existe User sin Employee. -->
<!-- @agent: Seguir este orden exacto al implementar el endpoint POST /api/users. -->

### Paso a paso

```text
1. [Frontend] GET /api/employees?filter[user_id]=null
   → Lista de Employees que NO son usuarios del sistema (user_id IS NULL)
   → El admin selecciona uno (ej: emp_000015)

2. [Frontend] POST /api/users { employee_id: "emp_000015", role: "USER" }

3. [Backend] Validate:
   - Employee existe y no está deleted
   - Employee.user_id IS NULL (no está ya vinculado a un User)
   - No existe otro User con ese email

4. [Backend] Create User (UUID):
   - Hereda datos de Employee (name, email, city_id)
   - Genera username desde Employee.name y Employee.lastName1
   - Asigna role del DTO (por defecto 'USER')
   - Asigna status 'ACTIVE'

5. [Backend] Create AuthUser via NextAuth Admin API:
   - Crea usuario en NextAuth con email y contraseña temporal
   - Envía email de invitación (set password)
   - NextAuth asigna UUID propio a AuthUser

6. [Backend] Link:
   - Employee.user_id = User.id (UUID)

7. [Backend] Sync:
   - User.email = Employee.email
   - AuthUser.email = User.email

8. [Backend] Return UserResponse
```

### Reverse flow (borrar User)

```text
1. [Frontend] DELETE /api/users/{user_id}

2. [Backend] Validate:
   - User existe y no está deleted
   - Employee.user_id === User.id (consistencia)

3. [Backend] Soft delete User:
   - User.deleted_at = NOW()
   - User.deleted_by = current_user.id

4. [Backend] Soft delete AuthUser:
   - AuthUser.deleted_at = NOW()
   - AuthUser.deleted_by = current_user.id

5. [Backend] Employee.user_id NO se modifica — se mantiene la referencia para restore.
```

### Borrado de Employee (en cascada)

```text
1. [Frontend] DELETE /api/employees/{employee_id}

2. [Backend] Validate employee existe

3. [Backend] If employee.user_id IS NOT NULL:
   - Soft delete User
   - Soft delete AuthUser (por email)
   - Employee.user_id NO se modifica (se mantiene para restore)

4. [Backend] Soft delete Employee:
   - Employee.deleted_at = NOW()
   - Employee.deleted_by = current_user.id

5. [Backend] Asignaciones que se limpian:
   - Vehicle.assigned_employee_id = null (NO se borra el vehículo)
   - InventoryItem.assigned_to = null (NO se borra el item)
```

---

## 17. Security & RLS

<!-- @agent: La seguridad se implementa en 3 capas: API Middleware → Row Level Security (PG) → City isolation. -->

### 17.1 Role hierarchy

```text
ROOT  → Acceso total. Ve todas las ciudades. Sin restricciones.
ADMIN → Gestión completa dentro de su(s) ciudad(es). CRUD en todas las entidades.
MANAGER → Gestión operativa. CRUD en Employee, Vehicle, Service, Inventory. Solo lectura en User.
USER  → Solo lectura en las entidades de su ciudad. No puede crear/modificar/borrar.
```

### 17.2 Role-permission matrix

| Entidad | Operación | ROOT | ADMIN | MANAGER | USER |
|---------|-----------|------|-------|---------|------|
| City | Read | ✅ | ✅ | ✅ | ✅ |
| City | Create/Update/Delete | ✅ | ❌ | ❌ | ❌ |
| User | Read | ✅ | ✅ | ✅ (sin role) | ✅ (sin role) |
| User | Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |
| Employee | Read | ✅ | ✅ | ✅ | ✅ |
| Employee | Create/Update/Delete | ✅ | ✅ | ✅ | ❌ |
| Vehicle | Read | ✅ | ✅ | ✅ | ✅ |
| Vehicle | Create/Update/Delete | ✅ | ✅ | ✅ | ❌ |
| Service | Read | ✅ | ✅ | ✅ | ✅ |
| Service | Create/Update/Delete | ✅ | ✅ | ✅ | ❌ |
| Inventory | Read | ✅ | ✅ | ✅ | ✅ |
| Inventory | Create/Update/Delete | ✅ | ✅ | ✅ | ❌ |
| Lookup tables | Read | ✅ | ✅ | ✅ | ✅ |
| Lookup tables | Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |

### 17.3 API Guard pattern

```typescript
// Pseudocódigo del middleware de endpoints

function apiHandler(handler, options: { roles?: UserRole[] }) {
  return async (req, res) => {
    // 1. Verify Auth — NextAuth.js getToken()
    const token = await getToken({ req });
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // 2. Verify Role
    if (options.roles && !options.roles.includes(token.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 3. Verify City Access (si aplica)
    // Si el token tiene city_id y la request pide otra ciudad → 403
    // ROOT y ADMIN pueden pasar X-City-ID header para cambiar de ciudad

    // 4. Ejecutar handler con token.user disponible
    return handler(req, res, token);
  };
}
```

### 17.4 RLS policies (PostgreSQL)

```sql
-- Policy base: usuarios solo ven datos de su ciudad
-- Asumiendo que la sesión tiene app.user_city_id y app.user_role

-- Employees
CREATE POLICY employee_city_isolation ON employees
  FOR ALL
  USING (
    deleted_at IS NULL
    AND (
      current_setting('app.user_role') = 'ROOT'
      OR city_id = current_setting('app.user_city_id')::VARCHAR
    )
  );

-- Polymorphic: ROOT ve todo, el resto ve solo su ciudad
-- Esta policy se repite para: vehicles, inventory_items, services, work_centers

-- Users: solo ADMIN+ pueden ver otros usuarios
CREATE POLICY user_read_policy ON users
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      current_setting('app.user_role') IN ('ROOT', 'ADMIN')
      OR id = current_setting('app.user_id')::UUID  -- verse a sí mismo
    )
  );
```

---

## 18. City resolution

<!-- @agent: El sistema necesita saber qué ciudad consultar en cada request. -->
<!-- @agent: Dos mecanismos: JWT claim (por defecto) y X-City-ID header (para admins multi-ciudad). -->

### 18.1 Estrategia

| Rol | Resolución | Detalle |
|-----|-----------|---------|
| ROOT | JWT `city_id` + puede sobrescribir con `X-City-ID` | Sin restricción |
| ADMIN | JWT `city_id` + puede sobrescribir con `X-City-ID` | Solo ciudades asignadas |
| MANAGER | JWT `city_id` fijo | No puede cambiar |
| USER | JWT `city_id` fijo | No puede cambiar |

### 18.2 Implementación

```typescript
// Pseudocódigo del resolver
function resolveCityId(req, token): string {
  const headerCity = req.headers['x-city-id'];

  if (headerCity) {
    // Solo ROOT y ADMIN pueden usar este header
    if (token.role === 'ROOT' || token.role === 'ADMIN') {
      return headerCity;
    }
    throw new Forbidden('Cannot override city');
  }

  return token.city_id; // Del JWT
}
```

### 18.3 Impacto en queries

```sql
-- Todas las queries de listado DEBEN incluir el filtro de ciudad
-- El city_id viene del resolver, NO del body de la request

SELECT * FROM employees
WHERE city_id = $1 AND deleted_at IS NULL;

SELECT * FROM vehicles v
JOIN work_centers wc ON wc.id = v.work_center_id
WHERE wc.city_id = $1 AND v.deleted_at IS NULL;
```

---

## 19. Pagination Standard

<!-- @agent: Todos los endpoints de listado usan esta misma estructura de paginación. -->

### 19.1 Request

```typescript
interface PaginationParams {
  page?: number;     // default: 1
  pageSize?: number; // default: 10, max: 100
}

// Opciones de pageSize estandar:
// [10, 25, 50, 100]
```

### 19.2 Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;      // Total de registros (sin paginar)
  page: number;       // Página actual
  pageSize: number;   // Tamaño de página
  totalPages: number; // Math.ceil(total / pageSize)
}
```

### 19.3 Implementación SQL

```sql
SELECT count(*) OVER() AS total, *
FROM employees
WHERE deleted_at IS NULL AND city_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
-- OFFSET = (page - 1) * pageSize
```

---

## 20. Search / Filter / Sort Convention

<!-- @agent: Convención uniforme de query params para todos los endpoints de listado. -->

### 20.1 Formato

```text
GET /api/employees
  ?search=torres                          ← búsqueda textual (ILIKE multi-campo)
  &filter[status_id]=es-1                 ← filtro exacto
  &filter[city_id]=city-1                 ← filtro exacto
  &filter[active]=true                    ← filtro booleano
  &filter[work_center_id]=wc-1,wc-2       ← filtro IN (array separado por comas)
  &sort=name                              ← campo de ordenación
  &order=asc                              ← asc | desc (default: asc)
  &page=1
  &pageSize=25
```

### 20.2 Reglas

| Regla | Descripción |
|-------|-------------|
| `search` | Busca en campos de texto (name, email, lastName1, lastName2). Implementado con `ILIKE '%term%'` o `to_tsvector` para español. |
| `filter[campo]=valor` | Filtro exacto. Múltiples filters se combinan con AND. |
| `filter[campo]=a,b` | Filtro IN (OR). Separado por comas. |
| `filter[campo]=` | Filtro IS NULL (si el valor está vacío). |
| `sort=campo` | Campo por el que ordenar. Si se omite, `created_at DESC`. |
| `order=asc/desc` | Dirección. Default: `asc`. |

### 20.3 Ejemplos de implementación

```typescript
// Construcción dinámica de WHERE clause
// Pseudocódigo — cada agente implementa según su ORM

function buildWhereClause(filters: Record<string, string>, search?: string) {
  const conditions = ['deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value.includes(',')) {
      const values = value.split(',');
      const placeholders = values.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`${key} IN (${placeholders})`);
      params.push(...values);
    } else if (value === '') {
      conditions.push(`${key} IS NULL`);
    } else {
      conditions.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  return { where: conditions.join(' AND '), params };
}
```

---

## 21. Query Patterns + índices compuestos

<!-- @agent: Patrones de consulta más frecuentes para guiar la creación de índices compuestos. -->

### 21.1 Dashboard / Resumen

```sql
-- Employees activos por work center (dashboard)
SELECT wc.name, COUNT(e.id) AS active_employees
FROM employees e
JOIN work_centers wc ON wc.id = e.work_center_id
WHERE e.city_id = $1 AND e.active = true AND e.deleted_at IS NULL
GROUP BY wc.name;

-- Vehicle distribution por tipo
SELECT vt.name AS vehicle_type, COUNT(v.id) AS total
FROM vehicles v
JOIN vehicle_type_options vt ON vt.id = v.vehicle_type_id
JOIN work_centers wc ON wc.id = v.work_center_id
WHERE wc.city_id = $1 AND v.deleted_at IS NULL
GROUP BY vt.name;

-- Inventory alerts (stock bajo)
SELECT category, COUNT(*) AS low_stock_items
FROM inventory_items
WHERE city_id = $1
  AND quantity < min_stock
  AND deleted_at IS NULL
GROUP BY category;
```

### 21.2 Alertas (próximos vencimientos)

```sql
-- Vehiculos con ITV próxima a vencer (30 días)
SELECT * FROM vehicles
WHERE work_center_id IN (SELECT id FROM work_centers WHERE city_id = $1)
  AND itv_expiration BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND deleted_at IS NULL
ORDER BY itv_expiration ASC;

-- Maquinaria próxima a mantenimiento
SELECT * FROM inventory_items
WHERE city_id = $1
  AND category = 'maquinaria'
  AND next_maintenance BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND deleted_at IS NULL
ORDER BY next_maintenance ASC;
```

### Índices compuestos recomendados

```sql
-- Dashboard employees por work center y ciudad
CREATE INDEX idx_employees_city_active_wc
  ON employees(city_id, active, work_center_id)
  WHERE deleted_at IS NULL;

-- Dashboard vehicles por ciudad y tipo
CREATE INDEX idx_vehicles_wc_type
  ON vehicles(work_center_id, vehicle_type_id)
  WHERE deleted_at IS NULL;

-- Inventory alerts por ciudad y categoría
CREATE INDEX idx_inventory_city_cat_stock
  ON inventory_items(city_id, category, quantity, min_stock)
  WHERE deleted_at IS NULL;

-- Expirations por work center y fecha
CREATE INDEX idx_vehicles_expirations
  ON vehicles(work_center_id, itv_expiration)
  WHERE deleted_at IS NULL;
```

---

## 22. Relationship Map

<!-- @agent: Mapa completo de relaciones entre entidades. -->
<!-- @agent: jerarquía de scoping: City → WorkCenter → entidades hijas. -->

### 22.1 Jerarquía de scoping

```text
City (city-1, city-2)
│
├── WorkCenter (wc-1..wc-21)
│     ├── city_id → City.id
│     │
│     ├── Employee (emp_000001..emp_000021)
│     │     ├── city_id → City.id
│     │     ├── work_center_id → WorkCenter.id
│     │     ├── category_id → EmployeeCategory.id
│     │     ├── status_id → EmployeeStatus.id
│     │     ├── work_day → WorkDay.id
│     │     ├── shift → Shift.id
│     │     ├── contract_type → ContractType.id
│     │     └── user_id → User.id (nullable)
│     │
│     ├── Vehicle (veh_v001..veh_v010)
│     │     ├── work_center_id → WorkCenter.id
│     │     ├── vehicle_type_id → VehicleTypeOption.id
│     │     └── assigned_employee_id → Employee.id
│     │
│     ├── Service (svc_1..svc_6)
│     │     ├── work_center_id → WorkCenter.id
│     │     └── ServiceTask
│     │           └── service_id → Service.id
│     │
│     └── InventoryItem (inv_000001..inv_000049)
│           ├── city_id → City.id
│           ├── work_center_id → WorkCenter.id
│           ├── subtype_id → InventorySubtype.id
│           ├── status_id → InventoryStatus.id
│           └── assigned_to → Employee.id (nullable)
│
├── User (UUID)
│     ├── city_id → City.id
│     ├── employee_id → Employee.id (nullable)
│     └── email → AuthUser.email (sync)
│
└── AuthUser (UUID — NextAuth)
      └── email → User.email (sync)
```

### 22.2 Tabla de Foreign Keys

| Entidad | FK | Apunta a | Nullable | Soft-delete behavior |
|---------|----|----------|----------|---------------------|
| `User` | `employee_id` | `Employee.id` | ❌ | `KEEP` — la referencia se mantiene para permitir restore |
| `User` | `city_id` | `City.id` | ❌ | `RESTRICT` |
| `Employee` | `user_id` | `User.id` | ✅ | `KEEP` — la referencia se mantiene para permitir restore |
| `Employee` | `city_id` | `City.id` | ❌ | `RESTRICT` |
| `Employee` | `work_center_id` | `WorkCenter.id` | ❌ | `RESTRICT` |
| `Employee` | `category_id` | `EmployeeCategory.id` | ❌ | `RESTRICT` |
| `Employee` | `status_id` | `EmployeeStatus.id` | ❌ | `RESTRICT` |
| `Employee` | `work_day` | `WorkDay.id` | ❌ | `RESTRICT` |
| `Employee` | `shift` | `Shift.id` | ❌ | `RESTRICT` |
| `Employee` | `contract_type` | `ContractType.id` | ❌ | `RESTRICT` |
| `WorkCenter` | `city_id` | `City.id` | ❌ | `RESTRICT` |
| `Vehicle` | `vehicle_type_id` | `VehicleTypeOption.id` | ❌ | `RESTRICT` |
| `Vehicle` | `work_center_id` | `WorkCenter.id` | ❌ | `RESTRICT` |
| `Vehicle` | `assigned_employee_id` | `Employee.id` | ✅ | `SET NULL` (asignación, no FK estructural) |
| `Service` | `work_center_id` | `WorkCenter.id` | ❌ | `RESTRICT` |
| `ServiceTask` | `service_id` | `Service.id` | ❌ | `CASCADE` (soft) |
| `InventoryItem` | `city_id` | `City.id` | ❌ | `RESTRICT` |
| `InventoryItem` | `work_center_id` | `WorkCenter.id` | ❌ | `RESTRICT` |
| `InventoryItem` | `subtype_id` | `InventorySubtype.id` | ❌ | `RESTRICT` |
| `InventoryItem` | `status_id` | `InventoryStatus.id` | ❌ | `RESTRICT` |
| `InventoryItem` | `assigned_to` | `Employee.id` | ✅ | `SET NULL` (asignación, no FK estructural) |

---

## 23. REST Endpoints

<!-- @agent: Endpoints REST sugeridos para la API de Next.js. -->
<!-- @agent: Todos los endpoints de listado soportan search, filter, sort, pagination. -->
<!-- @agent: Todos los endpoints aplican city isolation (sección 18). -->

### 23.1 Cities

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/cities` | Listar ciudades | Todos |
| `GET` | `/api/cities/:id` | Obtener ciudad | Todos |
| `POST` | `/api/cities` | Crear ciudad | ROOT |
| `PUT` | `/api/cities/:id` | Actualizar ciudad | ROOT |
| `DELETE` | `/api/cities/:id` | Soft-delete ciudad (RESTRICT si tiene WCs) | ROOT |

### 23.2 Users

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/users` | Listar usuarios | ADMIN+ |
| `GET` | `/api/users/:id` | Obtener usuario | ADMIN+ |
| `POST` | `/api/users` | Crear usuario desde Employee | ADMIN+ |
| `PUT` | `/api/users/:id` | Actualizar usuario | ADMIN+ |
| `DELETE` | `/api/users/:id` | Soft-delete usuario + AuthUser | ADMIN+ |

### 23.3 Employees

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/employees` | Listar empleados | Todos |
| `GET` | `/api/employees/:id` | Obtener empleado | Todos |
| `POST` | `/api/employees` | Crear empleado | MANAGER+ |
| `PUT` | `/api/employees/:id` | Actualizar empleado | MANAGER+ |
| `DELETE` | `/api/employees/:id` | Soft-delete. Cascada a User + AuthUser si tiene. | ADMIN+ |
| `PATCH` | `/api/employees/:id/restore` | Restaurar empleado + User + AuthUser | ADMIN+ |

### 23.4 WorkCenters

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/work-centers` | Listar centros de trabajo | Todos |
| `GET` | `/api/work-centers/:id` | Obtener centro | Todos |
| `POST` | `/api/work-centers` | Crear centro | ADMIN+ |
| `PUT` | `/api/work-centers/:id` | Actualizar centro | ADMIN+ |
| `DELETE` | `/api/work-centers/:id` | Soft-delete (RESTRICT si tiene hijos) | ADMIN+ |

### 23.5 Vehicles

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/vehicles` | Listar vehículos | Todos |
| `GET` | `/api/vehicles/:id` | Obtener vehículo | Todos |
| `POST` | `/api/vehicles` | Crear vehículo | MANAGER+ |
| `PUT` | `/api/vehicles/:id` | Actualizar vehículo | MANAGER+ |
| `DELETE` | `/api/vehicles/:id` | Soft-delete | MANAGER+ |

### 23.6 Services

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/services` | Listar servicios (con progreso) | Todos |
| `GET` | `/api/services/:id` | Obtener servicio + tasks | Todos |
| `POST` | `/api/services` | Crear servicio (genera 140 tasks) | MANAGER+ |
| `PUT` | `/api/services/:id` | Actualizar servicio | MANAGER+ |
| `DELETE` | `/api/services/:id` | Soft-delete (cascada a tasks) | MANAGER+ |
| `PATCH` | `/api/services/:id/tasks/:taskId` | Actualizar estado de task | MANAGER+ |

### 23.7 Inventory

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/inventory` | Listar inventario | Todos |
| `GET` | `/api/inventory/:id` | Obtener item | Todos |
| `POST` | `/api/inventory` | Crear item | MANAGER+ |
| `PUT` | `/api/inventory/:id` | Actualizar item | MANAGER+ |
| `DELETE` | `/api/inventory/:id` | Soft-delete | MANAGER+ |

### 23.8 Lookup endpoints

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/lookups/employee-categories` | Categorías de empleado | Todos |
| `GET` | `/api/lookups/employee-statuses` | Estados de empleado | Todos |
| `GET` | `/api/lookups/work-days` | Jornadas laborales | Todos |
| `GET` | `/api/lookups/shifts` | Turnos | Todos |
| `GET` | `/api/lookups/contract-types` | Tipos de contrato | Todos |
| `GET` | `/api/lookups/vehicle-types` | Tipos de vehículo | Todos |
| `GET` | `/api/lookups/inventory-categories` | Categorías de inventario | Todos |
| `GET` | `/api/lookups/inventory-subtypes` | Subtipos de inventario | Todos |
| `GET` | `/api/lookups/inventory-statuses` | Estados de inventario (por categoría) | Todos |

### 23.9 Endpoints especiales

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/dashboard/summary` | Resumen dashboard (empleados activos, vehículos, alertas) | Todos |
| `GET` | `/api/dashboard/alerts` | Alertas (ITV, mantenimiento, stock bajo) | Todos |
| `GET` | `/api/users/available-employees` | Employees sin user_id (para crear User) | ADMIN+ |

---

## 24. Mock Data Reference

<!-- @agent: Datos de ejemplo existentes en src/data/. NO modificar. -->
<!-- @agent: Usar como seed inicial para desarrollo y pruebas. -->

### 24.1 Ciudades

| ID | Nombre |
|----|--------|
| `city-1` | Alcalá de Henares |
| `city-2` | Guadalajara |

### 24.2 Usuarios de prueba (mock auth)

| Username | Email | Rol |
|----------|-------|-----|
| `m.torres` | `m.torres@on3.com` | ROOT |
| `admin` | `a.mendoza@on3.com` | ADMIN |
| `manager` | `b.salazar@on3.com` | MANAGER |
| `user` | `c.fuentes@on3.com` | USER |
| `diana_reyes` | `d.reyes@on3.com` | MANAGER |
| `eduardo_gomez` | `e.gomez@on3.com` | USER |
| `gabriela_vaca` | `g.vaca@on3.com` | ADMIN |
| `hugo_perez` | `h.perez@on3.com` | USER |

### 24.3 Empleados

Rango: `emp_000001` a `emp_000021` (20 empleados).

Ver archivo original: `src/data/mockEmployees.ts` (~264 líneas).

### 24.4 Centros de trabajo

Rango: `wc-1` a `wc-21`.

- city-1 (Alcalá): wc-1 (Nave) a wc-9 (Almacén) — 9 activos
- city-2 (Guadalajara): wc-11 a wc-21 — 9 activos, 2 inactivos

### 24.5 Vehículos

Rango: `veh_v001` a `veh_v010` (10 vehículos).

Ver archivo original: `src/data/mockVehicles.ts` (~232 líneas).

### 24.6 Servicios

Rango: `svc_1` a `svc_6` (6 servicios, 140 tareas c/u).

Ver archivo original: `src/data/mockServices.ts`.

### 24.7 Inventario

Rango: `inv_000001` a `inv_000049` (49 items).

| Categoría | Items |
|-----------|-------|
| ropa | 20 items (tallas S/M/L/XL/XXL) |
| epi | 18 items |
| maquinaria | 11 items |

Ver archivo original: `src/data/mockInventory.ts` (~838 líneas).

### 24.8 Password de prueba

```text
ROOT   → root123
ADMIN  → admin123
MANAGER → manager123
USER   → user123
```
