# Guía: cómo funciona un backend en Node.js (de cero a claro)

Esta guía es para quien está empezando. Explica **cómo fluye una petición** por este
proyecto (`pintoreria-backend`), **qué se implementa primero**, y **cómo manejamos las
contraseñas** de forma segura.

---

## 1. Idea general: ¿qué es un backend?

Un backend es un programa que vive en un servidor y **responde peticiones** que le llegan
por internet (desde el frontend, desde una app móvil, o desde una herramienta como Postman).

Cada petición sigue un ciclo simple:

```
El cliente manda algo (petición/request)
        │
        ▼
  El servidor la recibe (Express)
        │
        ▼
  Procesa (valida, consulta, guarda)
        │
        ▼
  Devuelve una respuesta (response)
```

Ejemplo concreto:

```
POST /auth/register  con  { email, fullName, password }
        │
        ▼
  Express recibe el JSON
        │
        ▼
  El server valida los datos, hashea la password, guarda en PostgreSQL
        │
        ▼
  Responde 201 { id, email, fullName, role, createdAt, isActive }
```

**Dato clave:** en este flujo, el *servidor* (Express + Prisma + PostgreSQL) es el que
procesa. El cliente jamás toca la base de datos directamente.

---

## 2. La estructura de este proyecto (arquitectura por capas)

Este proyecto está organizado con **arquitectura por capas**. Cada pieza tiene UN trabajo:

```
Cliente (Google/Postman)
   │
   ▼
┌──────────────────────┐
│  Controller          │  → Recibe la petición, valida lo que entra, y decide qué responder.
├──────────────────────┤
│  Service             │  → Lógica de negocio (reglas). Ej: "hashea la contraseña".
├──────────────────────┤
│  Repository          │  → Solo habla con la base de datos (guardar/leer). Un caparazón fino.
├──────────────────────┤
│  Prisma Client       │  → La herramienta que convierte tus llamadas en SQL.
├──────────────────────┤
│  PostgreSQL          │  → La base de datos (donde viven los datos realmente).
└──────────────────────┘
```

En el proyecto esto se ve así en el disco:

```
src/modules/auth/
├── controllers/   ← controller
├── services/      ← service
├── repositories/  ← repository
├── dtos/          ← modelos de ENTRADA
├── entities/      ← modelos de SALIDA
├── interfaces/    ← contratos (casi vacío por ahora)
└── mappers/       ← convierte entre modelos
```

### ¿Por qué separar en capas?

Para que el código sea **fácil de mantener**:

- Si cambia la base de datos, solo cambia el `repository`.
- Si cambia Express, solo cambia el `controller`.
- Si cambia una regla de negocio, solo cambia el `service`.
- Puedes **probar cada capa por separado** (tests).

La regla de oro de las capas:

> **Cada capa solo habla con la que está al lado.**
> Controller → Service → Repository → Prisma.
> Nunca al revés: el controller NUNCA toca Prisma directamente.

---

## 3. Los TRES modelos y por qué existen (la parte que confunde)

Este es el punto que más confunde al principio, así que vamos despacio.

Cuando escribes código de base de datos, te das cuenta de que **el mismo "usuario" se ve
distinto según la capa**:

| Modelo | Archivo | Qué es | Tiene password? | Ejemplo de campos |
|--------|---------|--------|-----------------|-------------------|
| **DTO de entrada** | `dtos/create-user.dto.ts` | Lo que **el cliente envía** al crear | Sí (texto plano, por ahora) | email, fullName, password, role |
| **Fila Prisma** | `@prisma/client` (`User`) | Lo que **se guarda** en PostgreSQL | Sí (**hasheado**) | id, email, fullName, password, role, createdAt, isActive |
| **Entidad de salida** | `entities/user.entity.ts` | Lo que **se responde** al cliente | **NO** | id, email, fullName, role, createdAt, isActive |

¿Por qué son distintos? Porque cada capa tiene necesidades distintas y **no queremos
mezclarlas**:

1. **El DTO de entrada existen** porque el cliente manda cosas que no son seguras para
   guardar aún (contraseñas en texto plano) y puede mandar basura (podría omitir campos,
   mandar un email inválido, etc.). El DTO es el "formato permitido" de lo que entra.
2. **La entidad existe** para que la contraseña **NUNCA salga** del servidor. Si un
   `GET /users` respondiera con `password`, cualquiera podría robarla. Por eso la entidad
   **no tiene** ese campo a propósito.
3. **La fila Prisma** es el reflejo exacto del modelo en la base de datos — con TODO,
   incluido el password hasheado.

Ese "campo que falta en el DTO" que te confundía → `id`, `createdAt`, `isActive` →
**no los manda el cliente, los genera el sistema** (la base de datos llena los defaults).
Por eso el DTO "puede estar incompleto": lo incompleto lo termina el sistema.

### El viaje completo de un usuario por los tres modelos

```
1. CLIENTE                mandó:      { email, fullName, password: "secreto123", role: "VENDEDOR" }
2. CONTROLLER             valida con  CreateUserDto (pasa ✓)
3. SERVICE                hashea:     password: "secreto123" → "$2a$10$Jc3...NuncaSeLee"
4. REPOSITORY             guarda:     prisma.user.create({ data: { email, fullName, password: hash, role } })
5. PRISMA/DB              rellena:    id: 1, createdAt: ahora, isActive: true
6. MAPPER toEntity()      descarta:   password (no pasa a la respuesta)
7. CONTROLLER             responde:   { id: 1, email, fullName, role, createdAt, isActive }   ← sin password
```

---

## 4. La dinámica de las contraseñas (lo que sí importa)

### ¿Por qué las contraseñas se "hashean" y no se guardan normal?

Si guardas la contraseña tal cual ("secreto123"), cualquiera que robe tu base de datos
(¡o un empleado entrometido!) la leería. Por eso se aplica un **hash**: una transformación
matemática de un solo sentido.

```
"secreto123"  →  (hmac/bcrypt)  →  "$2a$10$7EqJtq98hPqEX7fNZaFWoOhiD8gG0wljOmS1...8yKJ2zI"
```

- Es **imposible** volver atrás (recuperar "secreto123" desde el hash).
- Para "verificar" una contraseña, haces lo mismo con la que te dan y **compras los hash** (bcrypt lo hace por ti con `compare`).
- Se usa **bcrypt** (no SHA-256) porque bcrypt añade una *salt* (algo de azar) y es deliberadamente lento: cuesta más romperlo con fuerza bruta.

> Diferencia rápida: **hash** = un solo sentido (para contraseñas). **cifrado** = tiene
> llave para volver atrás (no sirve para contraseñas). Nunca cifres contraseñas ni las
> legible en logs.

### Regla de oro del password

> **El password viaja así:** el cliente lo manda en texto plano EN la petición (con HTTPS),
> el service lo hashea, y DE AHÍ EN ADELANTE SOLO EXISTE EL HASH.
> **Nunca** se devuelve, **nunca** se loguea, **nunca** se guarda en texto plano.

### El password paso a paso

**Crear usuario (registro):**

```
Cliente: { fullName, email, password: "secreto123" }
   │
   ▼  Controller → valida con CreateUserDto (el password viene en el DTO)
   ▼  Service → const hash = await bcrypt.hash("secreto123", 10)
   ▼  Repository → prisma.user.create({ data: { ..., password: hash } })
   ▼  Prisma guarda el HASH en la columna password de PostgreSQL
   ▼  toEntity() → la respuesta NO incluye password
```

**Iniciar sesión (login):**

```
Cliente: { email, password: "secreto123" }
   │
   ▼  Controller → valida
   ▼  Service → repository.findRowByEmail(email)  ← devuelve la FILA CRUDA (con hash)
   ▼  const ok = await bcrypt.compare("secreto123", fila.password)  ← compara hash vs hash
   │     · ok=true  → credenciales correctas → respondes (id, token, etc.)
   │     · ok=false → 401 "Credenciales inválidas"  (nunca digas cuál campo falló)
   ▼  La respuesta NUNCA incluye el password (ni el hash)
```

### ¿Por qué el login necesita la fila cruda pero el resto no?

Porque `bcrypt.compare()` necesita el **hash guardado** para comparar. Ese hash solo
existe en la fila Prisma. Por eso el repository tiene métodos "internos" (tipo
`findRowByEmail`) que devuelven la fila completa, pero **solo el service los usa** y nunca
los propaga hacia fuera.

### ¿Qué necesita el proyecto?

Aún **no hay librería de hash** en `package.json`. Tienes 2 opciones:

```bash
# Opción recomendada (simple y estándar)
npm i bcryptjs
npm i -D @types/bcryptjs
```

```ts
// O sin dependencias, usando el módulo nativo de Node (crypto.scrypt)
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
```

---

## 5. En qué orden implementar (de cero a un módulo funcional)

Si vas a crear una funcionalidad, este es el orden lógico:

### Paso 0 — El modelo en la base de datos (lo primero SIEMPRE)

Sin tabla no hay nada. En `prisma/schema.prisma`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  fullName  String
  password  String
  role      Role     @default(VENDEDOR)
  createdAt DateTime @default(now())
  isActive  Boolean  @default(true)
}

enum Role {
  ADMIN
  VENDEDOR
  ALMACENERO
}
```

Luego en la terminal:

```bash
npx prisma migrate dev --name init   # crea la tabla y el cliente Prisma
```

**Orden dentro de un módulo:**

| # | Pieza | Archivo | Pregunta que responde |
|---|-------|---------|-----------------------|
| 1 | **DTO de entrada** | `dtos/create-user.dto.ts` | ¿Qué campo usa el cliente Y CÓMO los valido? |
| 2 | **Entidad de salida** | `entities/user.entity.ts` | ¿Qué le devuelvo al cliente? |
| 3 | **Mapper** | `mappers/user.mapper.ts` | ¿Cómo paso Fila Prisma ↔ Entidad? |
| 4 | **Repository** | `repositories/user.repository.ts` | ¿Cómo guardo/leo en la base? |
| 5 | **Service** | `services/user.service.ts` | ¿Qué reglas aplico? (hash, validaciones de negocio) |
| 6 | **Controller** | `controllers/user.controller.ts` | ¿Cómo conecto HTTP con el service? |
| 7 | **Router** | en `src/index.ts` | ¿En qué URL responde? |

> Regla práctica: **se implementa de adentro hacia afuera** (base de datos → lógica →
> HTTP). Así cada capa tiene lista la de abajo cuando la necesitas.

### Paso 1 — DTO de entrada (`dtos/`)

Valida lo que entra, con zod (ya instalado):

```ts
import { z } from 'zod';
import { UserRole } from '../entities/user.entity';

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ALMACENERO']).optional(), // si no viene → VENDEDOR por default
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```

### Paso 2 — Entidad de salida (`entities/`)

Ya existe en `src/modules/auth/entities/user.entity.ts`. OJO: **sin password**.

```ts
export type UserRole = 'ADMIN' | 'VENDEDOR' | 'ALMACENERO';

export interface UserEntity {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  isActive: boolean;
}
```

### Paso 3 — Mapper (`mappers/`)

Ya existe (`user.mapper.ts`). `toEntity()` es el que "borra" el password cuando sale:

```ts
export function toEntity(row: User): UserEntity {
  // Simplemente NO copia row.password → ahí se garantiza que no se filtra
  return { id: row.id, email: row.email, fullName: row.fullName,
           role: row.role, createdAt: row.createdAt, isActive: row.isActive };
}
```

### Paso 4 — Repository (`repositories/`)

Habla con Prisma. Construye el `data` desde el DTO (no desde la entidad):

```ts
import { prisma } from '../../../database/client';
import { CreateUserDto } from '../dtos/create-user.dto';
import type { User } from '@prisma/client';
import { toEntity } from '../mappers/user.mapper';
import { UserEntity } from '../entities/user.entity';

// Operación de escritura (crear)
export async function createUser(input: CreateUserDto): Promise<UserEntity> {
  const row = await prisma.user.create({
    data: { email: input.email, fullName: input.fullName,
            password: input.password, role: input.role },
  });
  return toEntity(row);
}

// Lectura pública (solo Entity)
export async function findById(id: number): Promise<UserEntity | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toEntity(row) : null;
}

// ⚠️ Método INTERNO para el service cuando necesita el hash (login, cambio de password)
export async function findRowByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}
```

### Paso 5 — Service (`services/`)

Aquí vive la lógica (hashear, comparar, reglas):

```ts
import bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserEntity } from '../entities/user.entity';
import { createUser, findRowByEmail } from '../repositories/user.repository';
import { toEntity } from '../mappers/user.mapper';

const SALT_ROUNDS = 10;

export async function registerUser(input: CreateUserDto): Promise<UserEntity> {
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
  return createUser({ ...input, password: hashedPassword });
}

export async function login(email: string, passwordPlain: string): Promise<UserEntity> {
  const row = await findRowByEmail(email);   // fila cruda, para tener el hash
  if (!row || !(await bcrypt.compare(passwordPlain, row.password))) {
    throw new Error('Credenciales inválidas'); // mismo mensaje para email o password
  }
  return toEntity(row);                       // sale sin password
}
```

### Paso 6 — Controller (`controllers/`)

Conecta HTTP con el service. Valida con zod y traduce errores:

```ts
import { Request, Response } from 'express';
import { createUserSchema } from '../dtos/create-user.dto';
import { registerUser } from '../services/user.service';

export async function createUserHandler(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const user = await registerUser(parsed.data);
  return res.status(201).json(user);
}
```

### Paso 7 — Router (`src/index.ts`)

Registrar la URL:

```ts
app.post('/auth/register', createUserHandler);
```

### Paso 8 — Repetir por cada funcionalidad nueva

Cada nueva feature sigue el mismo camino. Ej: `sales`, `catalog`, `quotations` → cada uno
con su `schema`, `dtos`, `entities`, `repositories`, `services`, `controllers`.

---

## 6. Glosario rápido

| Término | Qué es |
|---------|--------|
| **Request (request)** | La petición que llega al server (método + URL + body). |
| **Response** | Lo que el server devuelve (estado + JSON). |
| **Ruta/Endpooint** | La URL pública, ej. `POST /auth/register`. |
| **DTO** | "Data Transfer Object". Define y valida lo que entra. |
| **Entity** | Modelo de salida/proceso interno, sin secretos. |
| **Mapper** | Función que traduce Fila Prisma ↔ Entidad. |
| **Hash** | Transformación de un solo sentido. Se usa para contraseñas. |
| **Salt** | Ruido aleatorio que se añade al hash para que IDs de passwords no se adivinen. |
| **bcrypt** | Algoritmo para hashear contraseñas (lento a propósito, con salt). |
| **Status code** | Número de respuesta: 200 OK, 201 Creado, 400 datos malos, 401 no autenticado, 404 no existe, 500 error. |
| **Middleware** | Código que corre antes de llegar a una ruta (ej. `express.json()` para leer el body). |
| **Prisma** | ORM: te deja hablar con PostgreSQL con código TS en vez de SQL. |
| **Migración** | Historial de cambios del esquema de la base de datos. |

---

## 7. Dudas frecuentes (FAQ)

### "¿Entonces el DTO y la entidad no son lo mismo?"

No. **DTO = lo que entra** (con password, validado por zod). **Entity = lo que sale**
(sin password). El DTO lo crea el cliente, la entity la decide el servidor.

### "¿A quién tomo para guardar: al DTO o a la entity?"

Al **DTO** como base, y le dejas a la DB / al service llenar lo demás (`id`, `createdAt`,
`isActive`, el hash). La entity no sirve para crear porque **por diseño no tiene password**.

### "¿El password viaja en texto plano?"

Solo **en el request**, y nunca en la respuesta. Además debe ir por HTTPS (cifrado del
canal). En el servidor se hashea antes de tocar la base de datos.

### "¿Por qué no puedo responder con el password aunque sea el hash?"

Porque el hash puede usarse para hacer fuerza bruta de tu parte, y porque no hay ninguna
razón para que el cliente lo vea. Si el frontend nunca lo necesita, jamás lo devuelvas.

### "¿Qué pasa si el usuario olvida su password?"

Nunca puedes recuperarlo (no sabes el original). Se le manda un enlace para **crear uno
nuevo** (flujo de "recuperación", no de "recuperar contraseña").

### "¿Por qué `login` necesita un método del repository que devuelve el hash?"

Porque `bcrypt.compare()` te pide ambos: el texto plano (del login) y el hash (guardado).
El hash solo está en la fila; pero ese método es **interno** (`findRowByEmail`), el resto
de las funciones del service usan los métodos que devuelven `UserEntity`.

### "¿Cómo pruebo mi API?"

Con **Postman** o **curl**. Ejemplo:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","fullName":"Ana","password":"secreto123"}'
```

### "¿Qué significa cada capa poder probarse sola?"

Que puedes escribir tests de service (sin HTTP) o de repository (contra una DB de prueba).
Mantener la lógica fuera del controller hace esto posible.

---

## 8. Resumen en 10 puntos

1. El backend **responde peticiones**: recibe → procesa → responde.
2. El proyecto usa **capas**: Controller → Service → Repository → Prisma → PostgreSQL.
3. **Nunca** el controller toca Prisma directo. Nunca saltes capas.
4. Hay **tres modelos**: DTO (entra), Fila Prisma (persiste), Entity (sale).
5. `id`, `createdAt`, `isActive` **no los manda el cliente**: los genera el sistema.
6. Las contraseñas se **hashean** con bcrypt (salt + lento a propósito).
7. El password **nunca sale** del servidor: ni l logs, ni respuestas, ni DB en claro.
8. `bcrypt.compare()` es para verificar (login); `bcrypt.hash()` para guardar (registro).
9. Orden de implementación: **schema → DTO → entity → mapper → repository → service → controller → router**.
10. Cada feature nueva repite el mismo patrón.