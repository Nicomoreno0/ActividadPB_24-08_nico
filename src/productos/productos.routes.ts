import { Router } from "express";
import type { ProductosController } from "./productos.controller.js";

export function crearProductosRouter(controller: ProductosController): Router {
  const router = Router();

  router.get("/", controller.listar);
  router.get("/:id", controller.obtenerPorId);
  router.post("/", controller.crear);
  router.put("/:id", controller.reemplazar);
  router.patch("/:id", controller.actualizar);
  router.delete("/:id", controller.eliminar);

  return router;
}
