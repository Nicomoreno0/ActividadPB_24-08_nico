import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";
import { crearBaseDeDatos, type SqliteDatabase } from "./db/sqlite.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFound } from "./middlewares/not-found.js";
import { PedidosController } from "./pedidos/pedidos.controller.js";
import { PedidosRepository } from "./pedidos/pedidos.repository.js";
import { crearPedidosRouter } from "./pedidos/pedidos.routes.js";
import { PedidosService } from "./pedidos/pedidos.service.js";
import { ProductosController } from "./productos/productos.controller.js";
import { ProductosRepository } from "./productos/productos.repository.js";
import { crearProductosRouter } from "./productos/productos.routes.js";
import { ProductosService } from "./productos/productos.service.js";

const directorioActual = dirname(fileURLToPath(import.meta.url));

export interface OpcionesApp {
  db?: SqliteDatabase;
  dbPath?: string;
}

export function crearApp(opciones: OpcionesApp = {}) {
  const db = opciones.db ?? crearBaseDeDatos(opciones.dbPath ?? "data/app.db");
  const productosRepository = new ProductosRepository(db);
  const pedidosRepository = new PedidosRepository(db);
  const productosService = new ProductosService(productosRepository, pedidosRepository);
  const pedidosService = new PedidosService(pedidosRepository, productosRepository);
  const productosController = new ProductosController(productosService);
  const pedidosController = new PedidosController(pedidosService);

  const app = express();
  app.use(express.json());

  const spec = parse(readFileSync(join(directorioActual, "..", "openapi.yaml"), "utf8"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));

  app.get("/salud", (_request, response) => {
    response.status(200).json({
      estado: "ok",
      fecha: new Date().toISOString()
    });
  });

  app.get("/api/v1/info", (_request, response) => {
    response.status(200).json({
      nombre: "API de productos y pedidos",
      version: "1.0.0"
    });
  });

  app.use("/api/v1/productos", crearProductosRouter(productosController));
  app.use("/api/v1/pedidos", crearPedidosRouter(pedidosController));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
