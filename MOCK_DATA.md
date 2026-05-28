# Mock Data — ON3BACK

## Endpoints base

| Recurso | URL |
|---|---|
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/api/docs` |

---

## Usuarios de prueba (Auth)

| Email | Contraseña | Rol |
|---|---|---|
| `000001@on3.com` | `root` | ROOT |
| `000002@on3.com` | `admin` | ADMIN |
| `000003@on3.com` | `manager` | MANAGER |
| `000004@on3.com` | `user` | USER |

**Login:**
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "000001@on3.com", "password": "root"}'
```

Respuesta: `{ accessToken, refreshToken, user: { uid, email, fullName, username, role, status, language } }`

---

## Roles

| Nombre | Nivel | Descripción |
|---|---|---|
| ROOT | ROOT (4) | Superadministrador con acceso completo |
| ADMIN | ADMIN (3) | Administrador con permisos amplios |
| MANAGER | MANAGER (2) | Gestor con supervisión de equipo |
| USER | USER (1) | Usuario estándar con acceso básico |

---

## Usuarios del sistema (User model)

| ID | Username | Email | FullName | Rol |
|---|---|---|---|---|
| `11111111-1111-1111-1111-111111111111` | `javier_martinez` | `000001@on3.com` | Javier Martínez López | ROOT |
| `22222222-2222-2222-2222-222222222222` | `ana_garcia` | `000002@on3.com` | Ana García Rodríguez | ADMIN |
| `33333333-3333-3333-3333-333333333333` | `carlos_hernandez` | `000003@on3.com` | Carlos Hernández Torres | MANAGER |
| `44444444-4444-4444-4444-444444444444` | `laura_perez` | `000004@on3.com` | Laura Pérez Sánchez | USER |

---

## Empleados

| ID | Nombre | Apellidos | Email | Ciudad | Centro | Categoría | Horario |
|---|---|---|---|---|---|---|---|
| `emp_000001` | Javier | Martínez López | `000001@on3.com` | Alcalá de Henares | Nave Central | Encargado | 08:00-16:00 |
| `emp_000002` | Ana | García Rodríguez | `000002@on3.com` | Alcalá de Henares | Nave Central | Jefe de Servicio | 08:00-16:00 |
| `emp_000003` | Carlos | Hernández Torres | `000003@on3.com` | Guadalajara | Puerta Madrid | Peón Limpieza | 08:00-16:00 |
| `emp_000004` | Laura | Pérez Sánchez | `000004@on3.com` | Guadalajara | Puerta Madrid | Peón Limpieza | 08:00-16:00 |

---

## Ciudades

| ID | Nombre |
|---|---|
| `city-1` | Alcalá de Henares |
| `city-2` | Guadalajara |

---

## Centros de trabajo

| ID | Nombre | Dirección | Ciudad |
|---|---|---|---|
| `wc-1` | Nave Central | Polígono Industrial 1 | city-1 |
| `wc-2` | Puerta Madrid | Av. Madrid 15 | city-2 |

---

## Categorías de empleado

| ID | Nombre |
|---|---|
| `ec-1` | Peón Limpieza |
| `ec-2` | Peón Recogida |
| `ec-3` | Oficial |
| `ec-4` | Oficial 2ª |
| `ec-5` | Mantenimiento |
| `ec-6` | Mecánico |
| `ec-7` | Encargado |
| `ec-8` | Encargado General |
| `ec-9` | Jefe de Servicio |
| `ec-10` | Administrativo |

---

## Estados de empleado

| ID | Nombre |
|---|---|
| `es-1` | Trabajando |
| `es-2` | Descanso |
| `es-3` | Baja |
| `es-4` | Días Propios |
| `es-5` | Días Acumulados |
| `es-6` | Vacaciones |

---

## Jornadas laborales

| ID | Nombre |
|---|---|
| `wd-1` | Lunes a Viernes |
| `wd-2` | Fin de Semana |
| `wd-3` | Rotativo 1 |
| `wd-4` | Rotativo 2 |

---

## Turnos

| ID | Nombre |
|---|---|
| `s-1` | Mañana |
| `s-2` | Tarde |
| `s-3` | Noche |

---

## Tipos de contrato

| ID | Nombre |
|---|---|
| `ct-1` | Indefinido |
| `ct-2` | Temporal |
| `ct-3` | Obra |

---

## Tipos de vehículo

| ID | Nombre | Tipo |
|---|---|---|
| `vt-1` | RAVO | BARREDORA |
| `vt-2` | Camión | CAMION |
| `vt-3` | Furgoneta | FURGONETA |
| `vt-4` | Turismo | TURISMO |
| `vt-5` | Porter | PORTER |

---

## Inventario — Categorías

| ID | Nombre | Value |
|---|---|---|
| `ic-1` | Ropa | `ropa` |
| `ic-2` | EPIs | `epi` |
| `ic-3` | Maquinaria | `maquinaria` |

### Ropa — Subtipos

| ID | Nombre |
|---|---|
| `ist-1` | Pantalón |
| `ist-2` | Camisa |
| `ist-3` | Chaqueta |
| `ist-4` | Forro |

### EPIs — Subtipos

| ID | Nombre |
|---|---|
| `ist-11` | Casco |
| `ist-12` | Guantes |
| `ist-13` | Mascarilla |
| `ist-14` | Máscara |
| `ist-15` | Arnés |
| `ist-16` | Protector |
| `ist-17` | Gafas |

### Maquinaria — Subtipos

| ID | Nombre |
|---|---|
| `ist-20` | Sopladora |
| `ist-21` | Desbrozadora |
| `ist-22` | Cortacésped |
| `ist-23` | Motocultor |
| `ist-24` | Hidrolimpiadora |
| `ist-25` | Barredora |
| `ist-26` | Motosierra |
| `ist-27` | Generador |

---

## Inventario — Estados

| ID | Nombre |
|---|---|
| `rs-1` | Disponible |
| `rs-2` | Agotado |
| `rs-3` | En Reposición |

---

## Permisos (asignados a ADMIN)

| Nombre | Descripción | Resource | Action |
|---|---|---|---|
| `users:read` | Ver usuarios | users | read |
| `users:create` | Crear usuarios | users | create |
| `users:update` | Actualizar usuarios | users | update |
| `users:delete` | Eliminar usuarios | users | delete |
| `roles:read` | Ver roles | roles | read |
| `roles:create` | Crear roles | roles | create |
| `roles:update` | Actualizar roles | roles | update |
| `roles:delete` | Eliminar roles | roles | delete |
| `audit:read` | Ver registros de auditoría | audit | read |
