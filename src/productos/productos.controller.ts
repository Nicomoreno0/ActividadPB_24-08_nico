import type { Request, Response } from "express";
import { parseId, parsearConsultaColeccion } from "../shared/http.js";
import { CAMPOS_ORDEN_PRODUCTO } from "./producto.js";
import {
  validarActualizarProducto,
  validarCrearProducto,
  validarReemplazarProducto
} from "./producto.dto.js";
import type { ProductosService } from "./productos.service.js";

export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  listar = (request: Request, response: Response): void => {
    const consulta = parsearConsultaColeccion(
      request.query as Record<string, unknown>,
      [...CAMPOS_ORDEN_PRODUCTO],
      "id"
    );
    const categoria = typeof request.query.categoria === "string" ? request.query.categoria : undefined;
    const resultado = this.service.listar(consulta, categoria);
    response.status(200).json(resultado);
  };

  obtenerPorId = (request: Request, response: Response): void => {
    const producto = this.service.obtenerPorId(parseId(request.params.id));
    response.status(200).json({ data: producto });
  };

  crear = (request: Request, response: Response): void => {
    const dto = validarCrearProducto(request.body);
    const producto = this.service.crear(dto);
    response.location(`/api/v1/productos/${producto.id}`).status(201).json({ data: producto });
  };

  reemplazar = (request: Request, response: Response): void => {
    const producto = this.service.reemplazar(parseId(request.params.id), validarReemplazarProducto(request.body));
    response.status(200).json({ data: producto });
  };

  actualizar = (request: Request, response: Response): void => {
    const producto = this.service.actualizar(parseId(request.params.id), validarActualizarProducto(request.body));
    response.status(200).json({ data: producto });
  };

  eliminar = (request: Request, response: Response): void => {
    this.service.eliminar(parseId(request.params.id));
    response.status(204).send();
  };
}
