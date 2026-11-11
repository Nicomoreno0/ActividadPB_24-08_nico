import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../src/errors/app-error.js";
import { PedidosService } from "../src/pedidos/pedidos.service.js";
import { PedidosRepositoryMock } from "./mocks/pedidos.repository.mock.js";
import { ProductosRepositoryMock, productosMock } from "./mocks/productos.repository.mock.js";

function crearServicio() {
  return new PedidosService(
    new PedidosRepositoryMock([]),
    new ProductosRepositoryMock(productosMock)
  );
}

test("crear descuenta stock del producto mockeado", () => {
  const productos = new ProductosRepositoryMock(productosMock);
  const servicio = new PedidosService(new PedidosRepositoryMock([]), productos);
  const pedido = servicio.crear({ productoId: 2, cantidad: 3, cliente: "Luis Gómez" });

  assert.equal(pedido.estado, "pendiente");
  assert.equal(productos.buscarPorId(2)?.stock, 2);
});

test("crear falla si no hay stock suficiente", () => {
  const servicio = crearServicio();
  assert.throws(
    () => servicio.crear({ productoId: 2, cantidad: 50, cliente: "Luis Gómez" }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "INSUFFICIENT_STOCK");
      return true;
    }
  );
});

test("obtenerPorId lanza 404 para un pedido inexistente", () => {
  const servicio = crearServicio();
  assert.throws(() => servicio.obtenerPorId(99), (error: unknown) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, 404);
    return true;
  });
});
