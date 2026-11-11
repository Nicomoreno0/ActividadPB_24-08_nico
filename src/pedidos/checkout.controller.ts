import type { NextFunction, Request, Response } from "express";
import { validarCheckout } from "./checkout.dto.js";
import type { CheckoutService } from "./checkout.service.js";

export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  crear = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const pedido = await this.service.procesar(validarCheckout(request.body));
      response.status(201).json({ data: pedido });
    } catch (error) {
      next(error);
    }
  };
}
