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

La persistencia queda en `data/app.db` (SQLite). Las pruebas usan una base en memoria.

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
├── productos/
└── pedidos/
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
