import { AppError } from "../errors/app-error.js";
import { CATEGORIAS_PRODUCTO, type CategoriaProducto } from "./producto.js";

export interface CrearProductoDto {
  nombre: string;
  precio: number;
  stock: number;
  categoria: CategoriaProducto;
}

export interface ActualizarProductoDto {
  nombre?: string;
  precio?: number;
  stock?: number;
  categoria?: CategoriaProducto;
}

function leerObjeto(datos: unknown): Record<string, unknown> {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    throw new AppError(400, "INVALID_BODY", "El cuerpo debe ser un objeto JSON");
  }

  return datos as Record<string, unknown>;
}

function validarNombre(valor: unknown): string {
  if (typeof valor !== "string" || valor.trim().length < 3) {
    throw new AppError(422, "INVALID_NAME", "El nombre debe tener al menos tres caracteres");
  }

  return valor.trim();
}

function validarPrecio(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
    throw new AppError(422, "INVALID_PRICE", "El precio debe ser un número mayor o igual a 0");
  }

  return valor;
}

function validarStock(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor < 0) {
    throw new AppError(422, "INVALID_STOCK", "El stock debe ser un entero mayor o igual a 0");
  }

  return valor;
}

function validarCategoria(valor: unknown): CategoriaProducto {
  if (typeof valor !== "string" || !CATEGORIAS_PRODUCTO.includes(valor as CategoriaProducto)) {
    throw new AppError(
      422,
      "INVALID_CATEGORY",
      `La categoría no es válida. Use: ${CATEGORIAS_PRODUCTO.join(", ")}`
    );
  }

  return valor as CategoriaProducto;
}

export function validarCrearProducto(datos: unknown): CrearProductoDto {
  const objeto = leerObjeto(datos);

  return {
    nombre: validarNombre(objeto.nombre),
    precio: validarPrecio(objeto.precio),
    stock: validarStock(objeto.stock),
    categoria: validarCategoria(objeto.categoria)
  };
}

export function validarReemplazarProducto(datos: unknown): CrearProductoDto {
  return validarCrearProducto(datos);
}

export function validarActualizarProducto(datos: unknown): ActualizarProductoDto {
  const objeto = leerObjeto(datos);
  const dto: ActualizarProductoDto = {};

  if (objeto.nombre !== undefined) dto.nombre = validarNombre(objeto.nombre);
  if (objeto.precio !== undefined) dto.precio = validarPrecio(objeto.precio);
  if (objeto.stock !== undefined) dto.stock = validarStock(objeto.stock);
  if (objeto.categoria !== undefined) dto.categoria = validarCategoria(objeto.categoria);

  if (Object.keys(dto).length === 0) {
    throw new AppError(422, "EMPTY_PATCH", "Debe enviar al menos un campo para actualizar");
  }

  return dto;
}
