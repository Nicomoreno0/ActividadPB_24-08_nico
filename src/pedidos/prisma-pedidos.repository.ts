import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import type { CheckoutDto } from "./checkout.dto.js";

const pedidoCompleto = {
  detalles: {
    include: { producto: true }
  }
} satisfies Prisma.PedidoInclude;

export type PedidoCheckout = Prisma.PedidoGetPayload<{ include: typeof pedidoCompleto }>;

export class PrismaPedidosRepository {
  constructor(private readonly prisma: PrismaClient) {}

  checkout(dto: CheckoutDto): Promise<PedidoCheckout> {
    return this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({
        where: { id: dto.usuarioId },
        select: { id: true }
      });
      if (!usuario) {
        throw new AppError(400, "USER_NOT_FOUND", "El usuario indicado no existe");
      }

      const pedido = await tx.pedido.create({
        data: { usuarioId: dto.usuarioId },
        select: { id: true }
      });

      let total = 0;
      for (const item of dto.productosComprados) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
          select: { id: true, precio: true }
        });
        if (!producto) {
          throw new AppError(400, "PRODUCT_NOT_FOUND", "Uno de los productos no existe");
        }

        const inventarioActualizado = await tx.producto.updateMany({
          where: { id: item.productoId, stock: { gte: item.cantidad } },
          data: { stock: { decrement: item.cantidad } }
        });
        if (inventarioActualizado.count !== 1) {
          throw new AppError(400, "INSUFFICIENT_STOCK", "No hay stock suficiente para completar el pedido");
        }

        await tx.detallePedido.create({
          data: {
            pedidoId: pedido.id,
            productoId: producto.id,
            cantidad: item.cantidad,
            precioUnitario: producto.precio
          }
        });
        total += producto.precio * item.cantidad;
      }

      return tx.pedido.update({
        where: { id: pedido.id },
        data: { total, estado: "confirmado" },
        include: pedidoCompleto
      });
    });
  }
}
