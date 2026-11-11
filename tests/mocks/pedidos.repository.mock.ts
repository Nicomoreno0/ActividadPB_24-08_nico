import type { Pedido } from "../../src/pedidos/pedido.js";
import type { FiltrosPedido, PedidosRepositoryPort } from "../../src/pedidos/pedidos.repository.js";

const pedidosMock: Pedido[] = [
  {
    id: 1,
    productoId: 1,
    cantidad: 2,
    cliente: "Ana Pérez",
    estado: "pendiente",
    fechaCreacion: "2026-08-03T10:00:00.000Z"
  }
];

export class PedidosRepositoryMock implements PedidosRepositoryPort {
  private pedidos: Pedido[];
  private siguienteId: number;

  constructor(semilla: Pedido[] = pedidosMock) {
    this.pedidos = semilla.map((pedido) => ({ ...pedido }));
    this.siguienteId = this.pedidos.reduce((maximo, pedido) => Math.max(maximo, pedido.id), 0) + 1;
  }

  guardar(pedido: Omit<Pedido, "id">): Pedido {
    const creado = { id: this.siguienteId, ...pedido };
    this.siguienteId += 1;
    this.pedidos.push(creado);
    return creado;
  }

  buscarPorId(id: number): Pedido | undefined {
    return this.pedidos.find((pedido) => pedido.id === id);
  }

  listar(filtros: FiltrosPedido): { items: Pedido[]; total: number } {
    let items = [...this.pedidos];

    if (filtros.q) {
      items = items.filter((pedido) => pedido.cliente.toLowerCase().includes(filtros.q!.toLowerCase()));
    }

    if (filtros.estado) {
      items = items.filter((pedido) => pedido.estado === filtros.estado);
    }

    if (filtros.productoId) {
      items = items.filter((pedido) => pedido.productoId === filtros.productoId);
    }

    const total = items.length;
    const start = (filtros.page - 1) * filtros.limit;
    return { items: items.slice(start, start + filtros.limit), total };
  }

  reemplazar(id: number, cambios: Pick<Pedido, "cantidad" | "cliente" | "estado">): Pedido | undefined {
    const pedido = this.buscarPorId(id);
    if (!pedido) return undefined;
    Object.assign(pedido, cambios);
    return pedido;
  }

  eliminar(id: number): boolean {
    const cantidad = this.pedidos.length;
    this.pedidos = this.pedidos.filter((pedido) => pedido.id !== id);
    return this.pedidos.length < cantidad;
  }

  contarPorProducto(productoId: number): number {
    return this.pedidos.filter((pedido) => pedido.productoId === productoId).length;
  }
}

export { pedidosMock };
