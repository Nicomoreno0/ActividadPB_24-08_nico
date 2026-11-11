import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { CATEGORIAS_PRODUCTO } from "./producto.js";
import type { PrismaCatalogoRepository } from "./prisma-catalogo.repository.js";

function leerObjeto(datos: unknown): Record<string, unknown> {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    throw new AppError(400, "INVALID_BODY", "El cuerpo debe ser un objeto JSON");
  }
  return datos as Record<string, unknown>;
}

function leerTexto(valor: unknown, campo: string, minimo: number): string {
  if (typeof valor !== "string" || valor.trim().length < minimo) {
    throw new AppError(400, "INVALID_BODY", `${campo} no es válido`);
  }
  return valor.trim();
}

function crearError(error: unknown, next: NextFunction): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    next(new AppError(409, "EMAIL_ALREADY_EXISTS", "Ya existe un usuario con ese email"));
    return;
  }
  next(error);
}

export class CatalogoController {
  constructor(private readonly repository: PrismaCatalogoRepository) {}

  listarProductos = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.status(200).json({ data: await this.repository.listarProductos() });
    } catch (error) {
      next(error);
    }
  };

  crearProducto = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const body = leerObjeto(request.body);
      if (typeof body.precio !== "number" || !Number.isFinite(body.precio) || body.precio < 0) {
        throw new AppError(400, "INVALID_BODY", "precio debe ser un número no negativo");
      }
      if (typeof body.stock !== "number" || !Number.isInteger(body.stock) || body.stock < 0) {
        throw new AppError(400, "INVALID_BODY", "stock debe ser un entero no negativo");
      }
      if (
        typeof body.categoria !== "string" ||
        !CATEGORIAS_PRODUCTO.includes(body.categoria as (typeof CATEGORIAS_PRODUCTO)[number])
      ) {
        throw new AppError(400, "INVALID_BODY", "La categoría del producto no es válida");
      }
      const producto = await this.repository.crearProducto({
        nombre: leerTexto(body.nombre, "nombre", 3),
        precio: body.precio,
        stock: body.stock,
        categoria: body.categoria
      });
      response.status(201).json({ data: producto });
    } catch (error) {
      crearError(error, next);
    }
  };

  crearUsuario = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const body = leerObjeto(request.body);
      const email = leerTexto(body.email, "email", 3);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError(400, "INVALID_BODY", "email debe ser una dirección válida");
      }
      const usuario = await this.repository.crearUsuario({
        nombre: leerTexto(body.nombre, "nombre", 3),
        email
      });
      response.status(201).json({ data: usuario });
    } catch (error) {
      crearError(error, next);
    }
  };
}
