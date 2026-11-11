import type { Producto } from "../../src/productos/producto.js";
import type { ActualizarProductoDto, CrearProductoDto } from "../../src/productos/producto.dto.js";
import type { FiltrosProducto, ProductosRepositoryPort } from "../../src/productos/productos.repository.js";

const productosMock: Producto[] = [
  {
    id: 1,
    nombre: "Arroz integral",
    precio: 1500,
    stock: 20,
    categoria: "alimentos",
    fechaCreacion: "2026-08-01T10:00:00.000Z"
  },
  {
    id: 2,
    nombre: "Agua mineral",
    precio: 800,
    stock: 5,
    categoria: "bebidas",
    fechaCreacion: "2026-08-02T10:00:00.000Z"
  }
];

export class ProductosRepositoryMock implements ProductosRepositoryPort {
  private productos: Producto[];
  private siguienteId: number;

  constructor(semilla: Producto[] = productosMock) {
    this.productos = semilla.map((producto) => ({ ...producto }));
    this.siguienteId = this.productos.reduce((maximo, producto) => Math.max(maximo, producto.id), 0) + 1;
  }

  guardar(dto: CrearProductoDto): Producto {
    const producto: Producto = {
      id: this.siguienteId,
      ...dto,
      fechaCreacion: new Date().toISOString()
    };
    this.siguienteId += 1;
    this.productos.push(producto);
    return producto;
  }

  buscarPorId(id: number): Producto | undefined {
    return this.productos.find((producto) => producto.id === id);
  }

  listar(filtros: FiltrosProducto): { items: Producto[]; total: number } {
    let items = [...this.productos];

    if (filtros.q) {
      items = items.filter((producto) => producto.nombre.toLowerCase().includes(filtros.q!.toLowerCase()));
    }

    if (filtros.categoria) {
      items = items.filter((producto) => producto.categoria === filtros.categoria);
    }

    items.sort((a, b) => {
      const campo = filtros.sort as keyof Producto;
      const valorA = a[campo];
      const valorB = b[campo];
      if (valorA < valorB) return filtros.order === "asc" ? -1 : 1;
      if (valorA > valorB) return filtros.order === "asc" ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const start = (filtros.page - 1) * filtros.limit;
    return { items: items.slice(start, start + filtros.limit), total };
  }

  reemplazar(id: number, dto: CrearProductoDto): Producto | undefined {
    const indice = this.productos.findIndex((producto) => producto.id === id);
    if (indice === -1) return undefined;
    this.productos[indice] = { ...this.productos[indice], ...dto };
    return this.productos[indice];
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
    const cantidad = this.productos.length;
    this.productos = this.productos.filter((producto) => producto.id !== id);
    return this.productos.length < cantidad;
  }

  ajustarStock(id: number, delta: number): Producto | undefined {
    const producto = this.buscarPorId(id);
    if (!producto) return undefined;
    producto.stock += delta;
    return producto;
  }
}

export { productosMock };
