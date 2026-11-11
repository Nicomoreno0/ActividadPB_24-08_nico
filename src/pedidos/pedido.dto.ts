import { AppError } from "../errors/app-error.js";
import { ESTADOS_PEDIDO, type EstadoPedido } from "./pedido.js";

export interface CrearPedidoDto {
  productoId: number;
  cantidad: number;
  cliente: string;
}

export interface ActualizarPedidoDto {
  cantidad?: number;
  cliente?: string;
  estado?: EstadoPedido;
}

function leerObjeto(datos: unknown): Record<string, unknown> {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    throw new AppError(400, "INVALID_BODY", "El cuerpo debe ser un objeto JSON");
  }

  return datos as Record<string, unknown>;
}

function validarProductoId(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) {
    throw new AppError(422, "INVALID_PRODUCT_ID", "El productoId debe ser un entero positivo");
  }

  return valor;
}

function validarCantidad(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) {
    throw new AppError(422, "INVALID_QUANTITY", "La cantidad debe ser un entero positivo");
  }

  return valor;
}

function validarCliente(valor: unknown): string {
  if (typeof valor !== "string" || valor.trim().length < 3) {
    throw new AppError(422, "INVALID_CLIENT", "El cliente debe tener al menos tres caracteres");
  }

  return valor.trim();
}

function validarEstado(valor: unknown): EstadoPedido {
  if (typeof valor !== "string" || !ESTADOS_PEDIDO.includes(valor as EstadoPedido)) {
    throw new AppError(
      422,
      "INVALID_STATUS",
      `El estado no es válido. Use: ${ESTADOS_PEDIDO.join(", ")}`
    );
  }

  return valor as EstadoPedido;
}

export function validarCrearPedido(datos: unknown): CrearPedidoDto {
  const objeto = leerObjeto(datos);

  return {
    productoId: validarProductoId(objeto.productoId),
    cantidad: validarCantidad(objeto.cantidad),
    cliente: validarCliente(objeto.cliente)
  };
}

export function validarReemplazarPedido(datos: unknown): Required<ActualizarPedidoDto> {
  const objeto = leerObjeto(datos);

  return {
    cantidad: validarCantidad(objeto.cantidad),
    cliente: validarCliente(objeto.cliente),
    estado: validarEstado(objeto.estado)
  };
}

export function validarActualizarPedido(datos: unknown): ActualizarPedidoDto {
  const objeto = leerObjeto(datos);
  const dto: ActualizarPedidoDto = {};

  if (objeto.cantidad !== undefined) dto.cantidad = validarCantidad(objeto.cantidad);
  if (objeto.cliente !== undefined) dto.cliente = validarCliente(objeto.cliente);
  if (objeto.estado !== undefined) dto.estado = validarEstado(objeto.estado);

  if (Object.keys(dto).length === 0) {
    throw new AppError(422, "EMPTY_PATCH", "Debe enviar al menos un campo para actualizar");
  }

  return dto;
}
