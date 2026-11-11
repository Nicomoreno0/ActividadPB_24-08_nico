import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { crearApp } from "../src/app.js";
import { crearBaseDeDatos } from "../src/db/sqlite.js";

function crearCliente() {
  return request(crearApp({ db: crearBaseDeDatos(":memory:") }));
}

test("GET /api/v1/info devuelve el nombre y la versión", async () => {
  const respuesta = await crearCliente().get("/api/v1/info");
  assert.equal(respuesta.status, 200);
  assert.deepEqual(respuesta.body, {
    nombre: "API de productos y pedidos",
    version: "1.0.0"
  });
});

test("CRUD completo de productos", async () => {
  const cliente = crearCliente();

  const creado = await cliente.post("/api/v1/productos").send({
    nombre: "Café molido",
    precio: 4500,
    stock: 12,
    categoria: "alimentos"
  });
  assert.equal(creado.status, 201);
  assert.equal(creado.body.data.nombre, "Café molido");
  const id = creado.body.data.id;

  const listado = await cliente.get("/api/v1/productos");
  assert.equal(listado.status, 200);
  assert.equal(listado.body.meta.total, 1);

  const individual = await cliente.get(`/api/v1/productos/${id}`);
  assert.equal(individual.status, 200);
  assert.equal(individual.body.data.id, id);

  const parche = await cliente.patch(`/api/v1/productos/${id}`).send({ stock: 9 });
  assert.equal(parche.status, 200);
  assert.equal(parche.body.data.stock, 9);

  const reemplazo = await cliente.put(`/api/v1/productos/${id}`).send({
    nombre: "Café premium",
    precio: 5200,
    stock: 7,
    categoria: "alimentos"
  });
  assert.equal(reemplazo.status, 200);
  assert.equal(reemplazo.body.data.nombre, "Café premium");

  const eliminado = await cliente.delete(`/api/v1/productos/${id}`);
  assert.equal(eliminado.status, 204);
});

test("validaciones y errores de productos", async () => {
  const cliente = crearCliente();

  const sinNombre = await cliente.post("/api/v1/productos").send({
    precio: 10,
    stock: 1,
    categoria: "otros"
  });
  assert.equal(sinNombre.status, 422);

  const idInvalido = await cliente.get("/api/v1/productos/abc");
  assert.equal(idInvalido.status, 400);

  const inexistente = await cliente.get("/api/v1/productos/99");
  assert.equal(inexistente.status, 404);

  const rutaDesconocida = await cliente.get("/api/v1/no-existe");
  assert.equal(rutaDesconocida.status, 404);
  assert.equal(rutaDesconocida.body.error.code, "ROUTE_NOT_FOUND");
});

test("CRUD de pedidos con stock y búsqueda por id", async () => {
  const cliente = crearCliente();

  const producto = await cliente.post("/api/v1/productos").send({
    nombre: "Yerba mate",
    precio: 3200,
    stock: 10,
    categoria: "alimentos"
  });
  const productoId = producto.body.data.id;

  const pedido = await cliente.post("/api/v1/pedidos").send({
    productoId,
    cantidad: 4,
    cliente: "María López"
  });
  assert.equal(pedido.status, 201);
  const pedidoId = pedido.body.data.id;

  const stock = await cliente.get(`/api/v1/productos/${productoId}`);
  assert.equal(stock.body.data.stock, 6);

  const individual = await cliente.get(`/api/v1/pedidos/${pedidoId}`);
  assert.equal(individual.status, 200);
  assert.equal(individual.body.data.cliente, "María López");

  const filtro = await cliente.get("/api/v1/pedidos?estado=pendiente&q=María");
  assert.equal(filtro.body.data.length, 1);

  const paginaVacia = await cliente.get("/api/v1/pedidos?page=9&limit=10");
  assert.equal(paginaVacia.status, 200);
  assert.deepEqual(paginaVacia.body.data, []);
  assert.equal(paginaVacia.body.meta.total, 1);

  const conflicto = await cliente.delete(`/api/v1/productos/${productoId}`);
  assert.equal(conflicto.status, 409);

  const baja = await cliente.delete(`/api/v1/pedidos/${pedidoId}`);
  assert.equal(baja.status, 204);
});
