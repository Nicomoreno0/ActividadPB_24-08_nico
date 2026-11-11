import { AppError } from "../errors/app-error.js";
import { metaPaginacion, type ConsultaColeccion } from "../shared/http.js";
import { CATEGORIAS_PRODUCTO, type Producto } from "./producto.js";
import type { ActualizarProductoDto, CrearProductoDto } from "./producto.dto.js";
import type { PedidosRepositoryPort } from "../pedidos/pedidos.repository.js";
import type { ProductosRepositoryPort } from "./productos.repository.js";

export class ProductosService {
  constructor(
    private readonly repository: ProductosRepositoryPort,
    private readonly pedidosRepository: PedidosRepositoryPort
  ) {}

  crear(dto: CrearProductoDto): Producto {
    return this.repository.guardar(dto);
  }

  obtenerPorId(id: number): Producto {
    const producto = this.repository.buscarPorId(id);

    if (!producto) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "El producto solicitado no existe");
    }

    return producto;
  }

  listar(consulta: ConsultaColeccion, categoria?: string) {
    let categoriaValida: Producto["categoria"] | undefined;

    if (categoria !== undefined) {
      if (!CATEGORIAS_PRODUCTO.includes(categoria as Producto["categoria"])) {
        throw new AppError(400, "INVALID_CATEGORY_FILTER", "El filtro de categoría no es válido");
      }
      categoriaValida = categoria as Producto["categoria"];
    }

    const { items, total } = this.repository.listar({ ...consulta, categoria: categoriaValida });

    return {
      data: items,
      meta: metaPaginacion(consulta.page, consulta.limit, total)
    };
  }

  reemplazar(id: number, dto: CrearProductoDto): Producto {
    this.obtenerPorId(id);
    const actualizado = this.repository.reemplazar(id, dto);

    if (!actualizado) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "El producto solicitado no existe");
    }

    return actualizado;
  }

  actualizar(id: number, dto: ActualizarProductoDto): Producto {
    this.obtenerPorId(id);
    const actualizado = this.repository.actualizar(id, dto);

    if (!actualizado) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "El producto solicitado no existe");
    }

    return actualizado;
  }

  eliminar(id: number): void {
    this.obtenerPorId(id);

    if (this.pedidosRepository.contarPorProducto(id) > 0) {
      throw new AppError(
        409,
        "PRODUCT_IN_USE",
        "No se puede eliminar el producto porque tiene pedidos asociados"
      );
    }

    this.repository.eliminar(id);
  }
}
