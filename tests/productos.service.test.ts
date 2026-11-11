import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../src/errors/app-error.js";
import { ProductosService } from "../src/productos/productos.service.js";
import { PedidosRepositoryMock } from "./mocks/pedidos.repository.mock.js";
import { ProductosRepositoryMock, productosMock } from "./mocks/productos.repository.mock.js";

function crearServicio() {
  return new ProductosService(new ProductosRepositoryMock(productosMock), new PedidosRepositoryMock());
}

test("obtenerPorId devuelve el producto mockeado", () => {
  const servicio = crearServicio();
  const producto = servicio.obtenerPorId(1);
  assert.equal(producto.nombre, "Arroz integral");
});

test("obtenerPorId lanza 404 si el id no existe", () => {
  const servicio = crearServicio();
  assert.throws(() => servicio.obtenerPorId(99), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 404);
    assert.equal(error.code, "PRODUCT_NOT_FOUND");
    return true;
  });
});

test("crear agrega un producto con datos mock", () => {
  const servicio = crearServicio();
  const creado = servicio.crear({
    nombre: "Detergente",
    precio: 2100,
    stock: 8,
    categoria: "limpieza"
  });

  assert.equal(creado.id, 3);
  assert.equal(servicio.obtenerPorId(3).nombre, "Detergente");
});

test("eliminar falla si el producto tiene pedidos asociados", () => {
  const servicio = crearServicio();
  assert.throws(() => servicio.eliminar(1), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 409);
    return true;
  });
});

test("listar aplica búsqueda sobre los datos mock", () => {
  const servicio = crearServicio();
  const resultado = servicio.listar({ page: 1, limit: 10, q: "agua", sort: "id", order: "asc" });
  assert.equal(resultado.data.length, 1);
  assert.equal(resultado.data[0].nombre, "Agua mineral");
  assert.equal(resultado.meta.total, 1);
});
