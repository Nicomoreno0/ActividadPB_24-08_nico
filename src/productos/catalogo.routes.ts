import { Router } from "express";
import type { CatalogoController } from "./catalogo.controller.js";

export function crearCatalogoRouter(controller: CatalogoController): Router {
  const router = Router();
  router.get("/productos", controller.listarProductos);
  router.post("/productos", controller.crearProducto);
  router.post("/usuarios", controller.crearUsuario);
  return router;
}
