import { Router } from "express";
import type { CheckoutController } from "./checkout.controller.js";

export function crearCheckoutRouter(controller: CheckoutController): Router {
  const router = Router();
  router.post("/pedidos", controller.crear);
  return router;
}
