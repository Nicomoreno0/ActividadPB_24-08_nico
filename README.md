# Unidad 2 · API CRUD de productos y pedidos

API HTTP versionada (`/api/v1`) para administrar **productos** y **pedidos**. Sigue la arquitectura modular de la unidad: rutas, controladores, servicios, repositorios, DTO, errores centralizados, SQLite, OpenAPI y pruebas.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación y arranque

```bash
npm install
npm start
```

- API: http://localhost:3000
- Salud: http://localhost:3000/salud
- Swagger UI: http://localhost:3000/api/docs

Para desarrollo con recarga:

```bash
npm run dev
```

Las rutas CRUD versionadas conservan su persistencia SQLite en `data/app.db`. El checkout nuevo usa Prisma y PostgreSQL.

## PostgreSQL y Prisma

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` a tu servidor PostgreSQL.
2. Instala dependencias y genera el cliente Prisma:

   ```bash
   npm install
   npm run prisma:generate
   ```

3. Aplica la migración inicial:

   ```bash
   npm run prisma:migrate -- --name init
   ```

El esquema define `Usuario`, `Producto`, `Pedido` y `DetallePedido`. Crea los datos del checkout mediante `POST /api/usuarios` y `POST /api/productos` (también disponible `GET /api/productos`); las rutas versionadas `/api/v1` se mantienen con su persistencia SQLite para compatibilidad.

`POST /api/pedidos` recibe `usuarioId` y `productosComprados` (arreglo de `{ productoId, cantidad }`). Las actualizaciones de stock, los detalles y el total del pedido se procesan en una única transacción; si falta stock, la transacción se revierte. Swagger UI está disponible en http://localhost:3000/api/docs.

Ejemplo:

```json
{
  "usuarioId": 1,
  "productosComprados": [
    { "productoId": 2, "cantidad": 3 },
    { "productoId": 4, "cantidad": 1 }
  ]
}
```

## Contrato

| Recurso | Colección | Individual |
| --- | --- | --- |
| Productos | `/api/v1/productos` | `/api/v1/productos/:id` |
| Pedidos | `/api/v1/pedidos` | `/api/v1/pedidos/:id` |

Métodos: `GET` (listar y por id), `POST`, `PUT`, `PATCH`, `DELETE`.

Ejemplo de creación:

```bash
curl -i -X POST -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Café molido\",\"precio\":4500,\"stock\":12,\"categoria\":\"alimentos\"}" ^
  http://localhost:3000/api/v1/productos
```

Listado con búsqueda, filtro, orden y paginación:

```
GET /api/v1/productos?page=1&limit=10&q=cafe&categoria=alimentos&sort=nombre&order=asc
```

Respuesta de error uniforme:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "El producto solicitado no existe",
    "details": []
  }
}
```

## Arquitectura

```
src/
├── app.ts
├── server.ts
├── errors/app-error.ts
├── middlewares/
├── db/sqlite.ts
├── db/prisma.ts
├── productos/
└── pedidos/ (CRUD existente y checkout transaccional Prisma)
```

La inyección de dependencias se hace por constructores en `crearApp`.

## Pruebas

```bash
npm test
npm run test:gherkin
```

- `tests/*service.test.ts`: servicios con repositorios mock.
- `tests/api.http.test.ts`: endpoints contra SQLite en memoria.
- `features/*.feature`: escenarios Gherkin (Cucumber).
