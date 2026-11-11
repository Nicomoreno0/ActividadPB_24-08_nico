import { AppError } from "../errors/app-error.js";
import { ESTADOS_PEDIDO, type EstadoPedido, type Pedido } from "./pedido.js";
import type { ActualizarPedidoDto, CrearPedidoDto } from "./pedido.dto.js";
import type { PedidosRepositoryPort } from "./pedidos.repository.js";
import type { ProductosRepositoryPort } from "../productos/productos.repository.js";
import { metaPaginacion, type ConsultaColeccion } from "../shared/http.js";

export class PedidosService {
  constructor(
    private readonly repository: PedidosRepositoryPort,
    private readonly productosRepository: ProductosRepositoryPort
  ) {}

  crear(dto: CrearPedidoDto): Pedido {
    const producto = this.productosRepository.buscarPorId(dto.productoId);

    if (!producto) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "El producto indicado no existe");
    }

    if (producto.stock < dto.cantidad) {
      throw new AppError(422, "INSUFFICIENT_STOCK", "No hay stock suficiente para el pedido");
    }

    this.productosRepository.ajustarStock(dto.productoId, -dto.cantidad);

    return this.repository.guardar({
      productoId: dto.productoId,
      cantidad: dto.cantidad,
      cliente: dto.cliente,
      estado: "pendiente",
      fechaCreacion: new Date().toISOString()
    });
  }

  obtenerPorId(id: number): Pedido {
    const pedido = this.repository.buscarPorId(id);

    if (!pedido) {
      throw new AppError(404, "ORDER_NOT_FOUND", "El pedido solicitado no existe");
    }

    return pedido;
  }

  listar(consulta: ConsultaColeccion, estado?: string, productoId?: string) {
    let estadoValido: EstadoPedido | undefined;
    let productoIdValido: number | undefined;

    if (estado !== undefined) {
      if (!ESTADOS_PEDIDO.includes(estado as EstadoPedido)) {
        throw new AppError(400, "INVALID_STATUS_FILTER", "El filtro de estado no es válido");
      }
      estadoValido = estado as EstadoPedido;
    }

    if (productoId !== undefined) {
      const id = Number(productoId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(400, "INVALID_PRODUCT_FILTER", "El filtro de producto no es válido");
      }
      productoIdValido = id;
    }

    const { items, total } = this.repository.listar({
      ...consulta,
      estado: estadoValido,
      productoId: productoIdValido
    });

    return {
      data: items,
      meta: metaPaginacion(consulta.page, consulta.limit, total)
    };
  }

  reemplazar(id: number, dto: Required<ActualizarPedidoDto>): Pedido {
    const actual = this.obtenerPorId(id);
    this.aplicarCambiosDeStock(actual, dto.cantidad, dto.estado);
    const actualizado = this.repository.reemplazar(id, dto);

    if (!actualizado) {
      throw new AppError(404, "ORDER_NOT_FOUND", "El pedido solicitado no existe");
    }

    return actualizado;
  }

  actualizar(id: number, dto: ActualizarPedidoDto): Pedido {
    const actual = this.obtenerPorId(id);
    const cantidad = dto.cantidad ?? actual.cantidad;
    const estado = dto.estado ?? actual.estado;
    this.aplicarCambiosDeStock(actual, cantidad, estado);

    const actualizado = this.repository.reemplazar(id, {
      cantidad,
      cliente: dto.cliente ?? actual.cliente,
      estado
    });

    if (!actualizado) {
      throw new AppError(404, "ORDER_NOT_FOUND", "El pedido solicitado no existe");
    }

    return actualizado;
  }

  eliminar(id: number): void {
    const actual = this.obtenerPorId(id);

    if (actual.estado !== "cancelado") {
      this.productosRepository.ajustarStock(actual.productoId, actual.cantidad);
    }

    this.repository.eliminar(id);
  }

  private aplicarCambiosDeStock(actual: Pedido, nuevaCantidad: number, nuevoEstado: EstadoPedido): void {
    if (actual.estado === "cancelado" && nuevoEstado === "cancelado") {
      return;
    }

    if (actual.estado !== "cancelado" && nuevoEstado === "cancelado") {
      this.productosRepository.ajustarStock(actual.productoId, actual.cantidad);
      return;
    }

    if (actual.estado === "cancelado" && nuevoEstado !== "cancelado") {
      const producto = this.productosRepository.buscarPorId(actual.productoId);
      if (!producto || producto.stock < nuevaCantidad) {
        throw new AppError(422, "INSUFFICIENT_STOCK", "No hay stock suficiente para reactivar el pedido");
      }
      this.productosRepository.ajustarStock(actual.productoId, -nuevaCantidad);
      return;
    }

    const diferencia = nuevaCantidad - actual.cantidad;
    if (diferencia > 0) {
      const producto = this.productosRepository.buscarPorId(actual.productoId);
      if (!producto || producto.stock < diferencia) {
        throw new AppError(422, "INSUFFICIENT_STOCK", "No hay stock suficiente para aumentar la cantidad");
      }
    }

    if (diferencia !== 0) {
      this.productosRepository.ajustarStock(actual.productoId, -diferencia);
    }
  }
}
