import type { CheckoutDto } from "./checkout.dto.js";
import type { PedidoCheckout, PrismaPedidosRepository } from "./prisma-pedidos.repository.js";

export class CheckoutService {
  constructor(private readonly repository: PrismaPedidosRepository) {}

  procesar(dto: CheckoutDto): Promise<PedidoCheckout> {
    return this.repository.checkout(dto);
  }
}
