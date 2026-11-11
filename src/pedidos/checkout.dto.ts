import { AppError } from "../errors/app-error.js";

export interface ProductoCompradoDto {
  productoId: number;
  cantidad: number;
}

export interface CheckoutDto {
  usuarioId: number;
  productosComprados: ProductoCompradoDto[];
}

function objeto(datos: unknown): Record<string, unknown> {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    throw new AppError(400, "INVALID_BODY", "El cuerpo debe ser un objeto JSON");
  }
  return datos as Record<string, unknown>;
}

function enteroPositivo(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) {
    throw new AppError(400, "INVALID_CHECKOUT", `${campo} debe ser un entero positivo`);
  }
  return valor;
}

export function validarCheckout(datos: unknown): CheckoutDto {
  const body = objeto(datos);
  if (!Array.isArray(body.productosComprados) || body.productosComprados.length === 0) {
    throw new AppError(
      400,
      "INVALID_CHECKOUT",
      "productosComprados debe contener al menos un producto"
    );
  }

  return {
    usuarioId: enteroPositivo(body.usuarioId, "usuarioId"),
    productosComprados: body.productosComprados.map((producto, index) => {
      const item = objeto(producto);
      return {
        productoId: enteroPositivo(item.productoId, `productosComprados[${index}].productoId`),
        cantidad: enteroPositivo(item.cantidad, `productosComprados[${index}].cantidad`)
      };
    })
  };
}
