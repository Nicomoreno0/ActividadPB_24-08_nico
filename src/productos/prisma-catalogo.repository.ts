import type { PrismaClient } from "@prisma/client";

export interface CrearProductoPrismaDto {
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
}

export interface CrearUsuarioPrismaDto {
  nombre: string;
  email: string;
}

export class PrismaCatalogoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listarProductos() {
    return this.prisma.producto.findMany({ orderBy: { id: "asc" } });
  }

  crearProducto(dto: CrearProductoPrismaDto) {
    return this.prisma.producto.create({ data: dto });
  }

  crearUsuario(dto: CrearUsuarioPrismaDto) {
    return this.prisma.usuario.create({ data: dto });
  }
}
