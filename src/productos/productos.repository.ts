import type { SqliteDatabase } from "../db/sqlite.js";
import type { ConsultaColeccion } from "../shared/http.js";
import type { Producto } from "./producto.js";
import type { ActualizarProductoDto, CrearProductoDto } from "./producto.dto.js";

interface FilaProducto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: Producto["categoria"];
  fecha_creacion: string;
}

export interface FiltrosProducto extends ConsultaColeccion {
  categoria?: Producto["categoria"];
}

export interface ProductosRepositoryPort {
  guardar(dto: CrearProductoDto): Producto;
  buscarPorId(id: number): Producto | undefined;
  listar(filtros: FiltrosProducto): { items: Producto[]; total: number };
  reemplazar(id: number, dto: CrearProductoDto): Producto | undefined;
  actualizar(id: number, dto: ActualizarProductoDto): Producto | undefined;
  eliminar(id: number): boolean;
  ajustarStock(id: number, delta: number): Producto | undefined;
}

function mapear(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    precio: fila.precio,
    stock: fila.stock,
    categoria: fila.categoria,
    fechaCreacion: fila.fecha_creacion
  };
}

export class ProductosRepository implements ProductosRepositoryPort {
  constructor(private readonly db: SqliteDatabase) {}

  guardar(dto: CrearProductoDto): Producto {
    const fechaCreacion = new Date().toISOString();
    const resultado = this.db
      .prepare(
        `INSERT INTO productos (nombre, precio, stock, categoria, fecha_creacion)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(dto.nombre, dto.precio, dto.stock, dto.categoria, fechaCreacion);

    return {
      id: Number(resultado.lastInsertRowid),
      ...dto,
      fechaCreacion
    };
  }

  buscarPorId(id: number): Producto | undefined {
    const fila = this.db
      .prepare("SELECT * FROM productos WHERE id = ?")
      .get(id) as FilaProducto | undefined;

    return fila ? mapear(fila) : undefined;
  }

  listar(filtros: FiltrosProducto): { items: Producto[]; total: number } {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.q) {
      condiciones.push("nombre LIKE ?");
      valores.push(`%${filtros.q}%`);
    }

    if (filtros.categoria) {
      condiciones.push("categoria = ?");
      valores.push(filtros.categoria);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
    const totalFila = this.db
      .prepare(`SELECT COUNT(*) AS total FROM productos ${where}`)
      .get(...valores) as { total: number };

    const order = filtros.order === "desc" ? "DESC" : "ASC";
    const offset = (filtros.page - 1) * filtros.limit;
    const filas = this.db
      .prepare(
        `SELECT * FROM productos ${where} ORDER BY ${filtros.sort} ${order} LIMIT ? OFFSET ?`
      )
      .all(...valores, filtros.limit, offset) as FilaProducto[];

    return { items: filas.map(mapear), total: totalFila.total };
  }

  reemplazar(id: number, dto: CrearProductoDto): Producto | undefined {
    const resultado = this.db
      .prepare(
        `UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria = ? WHERE id = ?`
      )
      .run(dto.nombre, dto.precio, dto.stock, dto.categoria, id);

    if (resultado.changes === 0) return undefined;
    return this.buscarPorId(id);
  }

  actualizar(id: number, dto: ActualizarProductoDto): Producto | undefined {
    const actual = this.buscarPorId(id);
    if (!actual) return undefined;

    return this.reemplazar(id, {
      nombre: dto.nombre ?? actual.nombre,
      precio: dto.precio ?? actual.precio,
      stock: dto.stock ?? actual.stock,
      categoria: dto.categoria ?? actual.categoria
    });
  }

  eliminar(id: number): boolean {
    const resultado = this.db.prepare("DELETE FROM productos WHERE id = ?").run(id);
    return resultado.changes > 0;
  }

  ajustarStock(id: number, delta: number): Producto | undefined {
    const resultado = this.db
      .prepare("UPDATE productos SET stock = stock + ? WHERE id = ?")
      .run(delta, id);

    if (resultado.changes === 0) return undefined;
    return this.buscarPorId(id);
  }
}
