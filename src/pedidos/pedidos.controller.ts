import type { Request, Response } from "express";
import { parseId, parsearConsultaColeccion } from "../shared/http.js";
import { CAMPOS_ORDEN_PEDIDO } from "./pedido.js";
import {
  validarActualizarPedido,
  validarCrearPedido,
  validarReemplazarPedido
} from "./pedido.dto.js";
import type { PedidosService } from "./pedidos.service.js";

export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  listar = (request: Request, response: Response): void => {
    const consulta = parsearConsultaColeccion(
      request.query as Record<string, unknown>,
      [...CAMPOS_ORDEN_PEDIDO],
      "id"
    );
    const estado = typeof request.query.estado === "string" ? request.query.estado : undefined;
    const productoId = typeof request.query.productoId === "string" ? request.query.productoId : undefined;
    const resultado = this.service.listar(consulta, estado, productoId);
    response.status(200).json(resultado);
  };

  obtenerPorId = (request: Request, response: Response): void => {
    const pedido = this.service.obtenerPorId(parseId(request.params.id));
    response.status(200).json({ data: pedido });
  };

  crear = (request: Request, response: Response): void => {
    const dto = validarCrearPedido(request.body);
    const pedido = this.service.crear(dto);
    response.location(`/api/v1/pedidos/${pedido.id}`).status(201).json({ data: pedido });
  };

  reemplazar = (request: Request, response: Response): void => {
    const pedido = this.service.reemplazar(parseId(request.params.id), validarReemplazarPedido(request.body));
    response.status(200).json({ data: pedido });
  };

  actualizar = (request: Request, response: Response): void => {
    const pedido = this.service.actualizar(parseId(request.params.id), validarActualizarPedido(request.body));
    response.status(200).json({ data: pedido });
  };

  eliminar = (request: Request, response: Response): void => {
    this.service.eliminar(parseId(request.params.id));
    response.status(204).send();
  };
}
