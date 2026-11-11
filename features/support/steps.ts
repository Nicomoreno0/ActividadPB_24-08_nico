import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import request from "supertest";
import type { ApiWorld } from "./world.js";

Given("una API con base de datos vacía", function (this: ApiWorld) {
  this.crearApi();
});

Given("un producto creado con nombre {string}", async function (this: ApiWorld, nombre: string) {
  const respuesta = await request(this.app)
    .post("/api/v1/productos")
    .send({
      nombre,
      precio: 3200,
      stock: 10,
      categoria: nombre.toLowerCase().includes("gaseosa") ? "bebidas" : "alimentos"
    });

  assert.equal(respuesta.status, 201);
  this.lastProductId = respuesta.body.data.id;
});

Given("un pedido creado para {string}", async function (this: ApiWorld, cliente: string) {
  const respuesta = await request(this.app)
    .post("/api/v1/pedidos")
    .send({
      productoId: this.lastProductId,
      cantidad: 1,
      cliente
    });

  assert.equal(respuesta.status, 201);
  this.lastOrderId = respuesta.body.data.id;
});

When("envío GET {string}", async function (this: ApiWorld, ruta: string) {
  this.lastResponse = await request(this.app).get(ruta);
});

When("envío POST {string} con:", async function (this: ApiWorld, ruta: string, cuerpo: string) {
  this.lastResponse = await request(this.app).post(ruta).send(JSON.parse(cuerpo));
  if (this.lastResponse.status === 201 && ruta.includes("productos")) {
    this.lastProductId = this.lastResponse.body.data.id;
  }
});

When(
  "envío POST {string} con el producto reciente:",
  async function (this: ApiWorld, ruta: string, cuerpo: string) {
    const payload = JSON.parse(cuerpo);
    this.lastResponse = await request(this.app)
      .post(ruta)
      .send({ ...payload, productoId: this.lastProductId });
    if (this.lastResponse.status === 201) {
      this.lastOrderId = this.lastResponse.body.data.id;
    }
  }
);

When("consulto el último producto por id", async function (this: ApiWorld) {
  this.lastResponse = await request(this.app).get(`/api/v1/productos/${this.lastProductId}`);
});

When("consulto el último pedido por id", async function (this: ApiWorld) {
  this.lastResponse = await request(this.app).get(`/api/v1/pedidos/${this.lastOrderId}`);
});

When("actualizo parcialmente el último producto con:", async function (this: ApiWorld, cuerpo: string) {
  this.lastResponse = await request(this.app)
    .patch(`/api/v1/productos/${this.lastProductId}`)
    .send(JSON.parse(cuerpo));
});

When("elimino el último producto", async function (this: ApiWorld) {
  this.lastResponse = await request(this.app).delete(`/api/v1/productos/${this.lastProductId}`);
});

Then("el código de estado es {int}", function (this: ApiWorld, codigo: number) {
  assert.equal(this.lastResponse?.status, codigo);
});

Then("el campo {string} es {string}", function (this: ApiWorld, ruta: string, esperado: string) {
  const valor = ruta.split(".").reduce((acumulado: unknown, clave) => {
    return (acumulado as Record<string, unknown>)[clave];
  }, this.lastResponse?.body);
  assert.equal(valor, esperado);
});

Then("la colección contiene {int} elemento", function (this: ApiWorld, cantidad: number) {
  const cuerpo = this.lastResponse?.body as { data: unknown[] };
  assert.equal(cuerpo.data.length, cantidad);
});

Then("la colección está vacía", function (this: ApiWorld) {
  const cuerpo = this.lastResponse?.body as { data: unknown[] };
  assert.deepEqual(cuerpo.data, []);
});

Then("los metadatos indican total {int}", function (this: ApiWorld, total: number) {
  const cuerpo = this.lastResponse?.body as { meta: { total: number } };
  assert.equal(cuerpo.meta.total, total);
});
