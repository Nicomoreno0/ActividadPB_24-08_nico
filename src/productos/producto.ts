export type CategoriaProducto = "alimentos" | "bebidas" | "limpieza" | "otros";

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: CategoriaProducto;
  fechaCreacion: string;
}

export const CATEGORIAS_PRODUCTO: CategoriaProducto[] = [
  "alimentos",
  "bebidas",
  "limpieza",
  "otros"
];

export const CAMPOS_ORDEN_PRODUCTO = ["id", "nombre", "precio", "stock", "categoria"] as const;
