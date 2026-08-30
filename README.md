# pintoreria-backend

Backend para el sistema de gestión de pintorería, construido con **Node.js**, **TypeScript**, **Express** y **Prisma** con **PostgreSQL**.

## Requisitos previos

- [Node.js](https://nodejs.org/) (>= 18)
- [Docker](https://www.docker.com/) y Docker Compose (para la base de datos PostgreSQL)
- [npx](https://www.npmjs.com/) (incluido con Node.js)

## Configuración del entorno

Copia el archivo de variables de entorno y ajústalo según sea necesario:

```bash
cp .env.example .env
```

Las variables usadas por el proyecto son:

| Variable            | Descripción                                    | Ejemplo        |
| ------------------- | ---------------------------------------------- | -------------- |
| `DATABASE_USER`     | Usuario de PostgreSQL                          | `pintoreria`   |
| `DATABASE_PASSWORD` | Contraseña de PostgreSQL                       | `pintoreria123`|
| `DATABASE_HOST`     | Host de PostgreSQL                             | `localhost`    |
| `PORT_DB`           | Puerto de PostgreSQL (mapeado al contenedor)   | `5433`         |
| `DATABASE_NAME`     | Nombre de la base de datos                     | `pintoreria_db`|
| `DATABASE_URL`      | URL de conexión de la aplicación               | `postgresql://pintoreria:pintoreria123@localhost:5433/pintoreria_db` |
| `PORT`              | Puerto del servidor Express                    | `3000`         |

> **Nota:** `.env` nunca se sube al repositorio (está en `.gitignore`). Crea tu propio `.env` local.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar la base de datos (Docker)

```bash
docker compose up -d
```

Esto inicia el contenedor PostgreSQL `pintoreriadb` escuchando en el puerto definido por `PORT_DB` (por defecto `5433`).

> Si corres por primera vez, el contenedor tardará unos segundos en volverse saludable.

### 3. Aplicar las migraciones de Prisma

```bash
npx prisma migrate dev
```

Aplica las migraciones existentes (y crea el cliente de Prisma). Para crear una nueva migración con nombre:

```bash
npx prisma migrate dev --name <nombre>
```

### 4. Iniciar el servidor en desarrollo

```bash
npm run dev
```

El servidor quedará disponible en `http://localhost:3000`.

## Scripts disponibles

| Comando                 | Descripción                                     |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Inicia el servidor en modo desarrollo (hot reload con `tsx watch`) |
| `npm run build`         | Compila el proyecto TypeScript a `dist/`        |
| `npm start`             | Ejecuta el build compilado en `dist/index.js`   |
| `npm run lint`          | Ejecuta ESLint                                 |
| `npm run format`        | Formatea el código con Prettier                |

## Endpoints de verificación

| Método | Ruta         | Descripción                              |
| ------ | ------------ | ---------------------------------------- |
| GET    | `/health`    | Verifica que el servidor esté corriendo  |

## Estructura del proyecto

```
.
├── docker-compose.yaml      # Orquestación de PostgreSQL (Docker)
├── prisma/
│   ├── schema.prisma        # Modelos de la base de datos
│   └── migrations/          # Migraciones generadas por Prisma
├── prisma.config.ts         # Configuración de Prisma (genera la URL de conexión)
├── src/
│   ├── index.ts             # Punto de entrada del servidor Express
│   ├── common/              # Utilidades compartidas
│   ├── config/              # Configuraciones
│   ├── database/            # Conexión a la base de datos
│   └── modules/             # Módulos de negocio (auth, sales, catalog, ...)
│       └── <modulo>/
│           ├── controllers/
│           ├── dtos/
│           ├── entities/
│           ├── interfaces/
│           ├── repositories/
│           ├── services/
│           └── ...
├── .env                    # Variables de entorno (NO se versiona)
└── package.json
```

## Convención de ramas

Las ramas se nombran con el formato **`tipo/modulo`**:

```
tipo/modulo-breve descripcion de lo que se hará
```

Ejemplos:

- `feat/auth-implementar login y registro de usuarios`
- `feat/sales-crear modulo de ventas`
- `fix/catalog-corregir validacion de stock`
- `chore/deps-actualizar dependencias`

### Tipos de rama

| Tipo     | Uso                                         |
| -------- | ------------------------------------------- |
| `feat`   | Nueva funcionalidad                         |
| `fix`    | Corrección de errores                       |
| `refactor` | Cambios de código sin alterar comportamiento |
| `docs`   | Cambios en documentación                    |
| `chore`  | Tareas de mantenimiento                      |
| `test`   | Cambios en pruebas                          |

## Convención de commits

Los mensajes de commit siguen el formato **`tipo: descripcion`** en minúsculas:

```
tipo: descripcion
```

Ejemplos:

- `feat: agregar modelo User y rol de usuario en Prisma`
- `fix: corregir puerto de conexion de Prisma a PostgreSQL`
- `refactor: simplificar configuracion del datasource`
- `docs: actualizar README con instrucciones de instalacion`

### Tipos de commit

| Tipo      | Uso                                          |
| --------- | -------------------------------------------- |
| `feat`    | Nueva funcionalidad                          |
| `fix`     | Corrección de errores                        |
| `refactor`| Cambios de código sin alterar comportamiento |
| `docs`    | Cambios en documentación                     |
| `chore`   | Tareas de mantenimiento                       |
| `test`    | Cambios en pruebas                           |
| `style`   | Cambios de formato sin afectar lógica         |
```
