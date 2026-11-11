import type { SqliteDatabase } from "../db/sqlite.js";
import type { ConsultaColeccion } from "../shared/http.js";
import type { EstadoPedido, Pedido } from "./pedido.js";

interface FilaPedido {
  id: number;
  producto_id: number;
  cantidad: number;
  cliente: string;
  estado: EstadoPedido;
  fecha_creacion: string;
}

export interface FiltrosPedido extends ConsultaColeccion {
  estado?: EstadoPedido;
  productoId?: number;
}

export interface PedidosRepositoryPort {
  guardar(pedido: Omit<Pedido, "id">): Pedido;
  buscarPorId(id: number): Pedido | undefined;
  listar(filtros: FiltrosPedido): { items: Pedido[]; total: number };
  reemplazar(id: number, cambios: Pick<Pedido, "cantidad" | "cliente" | "estado">): Pedido | undefined;
  eliminar(id: number): boolean;
  contarPorProducto(productoId: number): number;
}

function mapear(fila: FilaPedido): Pedido {
  return {
    id: fila.id,
    productoId: fila.producto_id,
    cantidad: fila.cantidad,
    cliente: fila.cliente,
    estado: fila.estado,
    fechaCreacion: fila.fecha_creacion
  };
}

export class PedidosRepository implements PedidosRepositoryPort {
  constructor(private readonly db: SqliteDatabase) {}

  guardar(pedido: Omit<Pedido, "id">): Pedido {
    const resultado = this.db
      .prepare(
        `INSERT INTO pedidos (producto_id, cantidad, cliente, estado, fecha_creacion)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(pedido.productoId, pedido.cantidad, pedido.cliente, pedido.estado, pedido.fechaCreacion);

    return { id: Number(resultado.lastInsertRowid), ...pedido };
  }

  buscarPorId(id: number): Pedido | undefined {
    const fila = this.db
      .prepare("SELECT * FROM pedidos WHERE id = ?")
      .get(id) as FilaPedido | undefined;

    return fila ? mapear(fila) : undefined;
  }

  listar(filtros: FiltrosPedido): { items: Pedido[]; total: number } {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.q) {
      condiciones.push("cliente LIKE ?");
      valores.push(`%${filtros.q}%`);
    }

    if (filtros.estado) {
      condiciones.push("estado = ?");
      valores.push(filtros.estado);
    }

    if (filtros.productoId) {
      condiciones.push("producto_id = ?");
      valores.push(filtros.productoId);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
    const totalFila = this.db
      .prepare(`SELECT COUNT(*) AS total FROM pedidos ${where}`)
      .get(...valores) as { total: number };

    const order = filtros.order === "desc" ? "DESC" : "ASC";
    const offset = (filtros.page - 1) * filtros.limit;
    const filas = this.db
      .prepare(
        `SELECT * FROM pedidos ${where} ORDER BY ${filtros.sort} ${order} LIMIT ? OFFSET ?`
      )
      .all(...valores, filtros.limit, offset) as FilaPedido[];

    return { items: filas.map(mapear), total: totalFila.total };
  }

  reemplazar(id: number, cambios: Pick<Pedido, "cantidad" | "cliente" | "estado">): Pedido | undefined {
    const resultado = this.db
      .prepare("UPDATE pedidos SET cantidad = ?, cliente = ?, estado = ? WHERE id = ?")
      .run(cambios.cantidad, cambios.cliente, cambios.estado, id);

    if (resultado.changes === 0) return undefined;
    return this.buscarPorId(id);
  }

  eliminar(id: number): boolean {
    const resultado = this.db.prepare("DELETE FROM pedidos WHERE id = ?").run(id);
    return resultado.changes > 0;
  }

  contarPorProducto(productoId: number): number {
    const fila = this.db
      .prepare("SELECT COUNT(*) AS total FROM pedidos WHERE producto_id = ?")
      .get(productoId) as { total: number };

    return fila.total;
  }
}
