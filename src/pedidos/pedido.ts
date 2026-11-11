export type EstadoPedido = "pendiente" | "confirmado" | "cancelado";

export interface Pedido {
  id: number;
  productoId: number;
  cantidad: number;
  cliente: string;
  estado: EstadoPedido;
  fechaCreacion: string;
}

export const ESTADOS_PEDIDO: EstadoPedido[] = ["pendiente", "confirmado", "cancelado"];
export const CAMPOS_ORDEN_PEDIDO = ["id", "cantidad", "cliente", "estado", "producto_id"] as const;
