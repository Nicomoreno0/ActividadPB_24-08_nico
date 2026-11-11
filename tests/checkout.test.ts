import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "@prisma/client";
import request from "supertest";
import { crearApp } from "../src/app.js";

interface EstadoFake {
  stock: Map<number, number>;
  pedidos: Array<Record<string, unknown>>;
  detalles: Array<Record<string, unknown>>;
}

function crearPrismaFalso(inventarioInicial: Record<number, number>) {
  const estado: EstadoFake = {
    stock: new Map(Object.entries(inventarioInicial).map(([id, stock]) => [Number(id), stock])),
    pedidos: [],
    detalles: []
  };
  let siguientePedido = 1;
  const productoPrecios = new Map([
    [1, 25],
    [2, 40]
  ]);
  const tx = {
    usuario: {
      findUnique: async () => ({ id: 1 })
    },
    producto: {
      findUnique: async ({ where }: { where: { id: number } }) => {
        const precio = productoPrecios.get(where.id);
        return precio === undefined ? null : { id: where.id, precio };
      },
      updateMany: async ({ where, data }: {
        where: { id: number; stock: { gte: number } };
        data: { stock: { decrement: number } };
      }) => {
        const stock = estado.stock.get(where.id);
        if (stock === undefined || stock < where.stock.gte) return { count: 0 };
        estado.stock.set(where.id, stock - data.stock.decrement);
        return { count: 1 };
      }
    },
    pedido: {
      create: async ({ data }: { data: { usuarioId: number } }) => {
        const pedido = { id: siguientePedido++, usuarioId: data.usuarioId };
        estado.pedidos.push(pedido);
        return pedido;
      },
      update: async ({ where, data }: { where: { id: number }; data: { total: number } }) => ({
        ...estado.pedidos.find((pedido) => pedido.id === where.id),
        ...data,
        detalles: estado.detalles
      })
    },
    detallePedido: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        estado.detalles.push(data);
        return data;
      }
    }
  };
  const prisma = {
    $transaction: async (operacion: (transaction: typeof tx) => Promise<unknown>) => {
      const copia: EstadoFake = {
        stock: new Map(estado.stock),
        pedidos: structuredClone(estado.pedidos),
        detalles: structuredClone(estado.detalles)
      };
      try {
        return await operacion(tx);
      } catch (error) {
        estado.stock = copia.stock;
        estado.pedidos = copia.pedidos;
        estado.detalles = copia.detalles;
        throw error;
      }
    },
    producto: {
      findMany: async () => [],
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: 3,
        ...data,
        fechaCreacion: new Date().toISOString()
      })
    },
    usuario: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({
        id: 2,
        ...data,
        creadoEn: new Date().toISOString()
      })
    }
  } as unknown as PrismaClient;

  return { prisma, estado };
}

test("POST /api/pedidos finaliza checkout y devuelve el pedido", async () => {
  const { prisma, estado } = crearPrismaFalso({ 1: 5, 2: 3 });
  const app = crearApp({ dbPath: ":memory:", prisma });

  const respuesta = await request(app).post("/api/pedidos").send({
    usuarioId: 1,
    productosComprados: [
      { productoId: 1, cantidad: 2 },
      { productoId: 2, cantidad: 1 }
    ]
  });

  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.data.total, 90);
  assert.equal(estado.stock.get(1), 3);
  assert.equal(estado.stock.get(2), 2);
  assert.equal(estado.detalles.length, 2);
});

test("POST /api/pedidos devuelve 400 y revierte el checkout si falta stock", async () => {
  const { prisma, estado } = crearPrismaFalso({ 1: 5, 2: 0 });
  const app = crearApp({ dbPath: ":memory:", prisma });

  const respuesta = await request(app).post("/api/pedidos").send({
    usuarioId: 1,
    productosComprados: [
      { productoId: 1, cantidad: 2 },
      { productoId: 2, cantidad: 1 }
    ]
  });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.error.code, "INSUFFICIENT_STOCK");
  assert.equal(estado.stock.get(1), 5);
  assert.equal(estado.pedidos.length, 0);
  assert.equal(estado.detalles.length, 0);
});

test("POST /api/pedidos rechaza datos incompletos antes de iniciar la transacción", async () => {
  const { prisma } = crearPrismaFalso({ 1: 5 });
  const app = crearApp({ dbPath: ":memory:", prisma });

  const respuesta = await request(app).post("/api/pedidos").send({
    usuarioId: 1,
    productosComprados: []
  });

  assert.equal(respuesta.status, 400);
  assert.equal(respuesta.body.error.code, "INVALID_CHECKOUT");
});

test("el catálogo PostgreSQL permite crear usuario y producto", async () => {
  const { prisma } = crearPrismaFalso({ 1: 5 });
  const app = crearApp({ dbPath: ":memory:", prisma });

  const usuario = await request(app).post("/api/usuarios").send({
    nombre: "Ana Pérez",
    email: "ana@example.com"
  });
  const producto = await request(app).post("/api/productos").send({
    nombre: "Café molido",
    precio: 25,
    stock: 5,
    categoria: "alimentos"
  });

  assert.equal(usuario.status, 201);
  assert.equal(usuario.body.data.id, 2);
  assert.equal(producto.status, 201);
  assert.equal(producto.body.data.nombre, "Café molido");
});
