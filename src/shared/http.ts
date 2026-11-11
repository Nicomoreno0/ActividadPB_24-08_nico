import { AppError } from "../errors/app-error.js";

export function parseId(valor: string | undefined): number {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "INVALID_ID", "El identificador no es válido");
  }

  return id;
}

export interface ConsultaColeccion {
  page: number;
  limit: number;
  q?: string;
  sort: string;
  order: "asc" | "desc";
}

export function parsearConsultaColeccion(
  query: Record<string, unknown>,
  camposOrden: string[],
  ordenPredeterminado: string
): ConsultaColeccion {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  if (!Number.isInteger(page) || !Number.isInteger(limit)) {
    throw new AppError(400, "INVALID_PAGINATION", "page y limit deben ser enteros positivos");
  }

  const sort = typeof query.sort === "string" ? query.sort : ordenPredeterminado;
  if (!camposOrden.includes(sort)) {
    throw new AppError(400, "INVALID_SORT", `El campo de ordenamiento no es válido. Use: ${camposOrden.join(", ")}`);
  }

  const order = query.order === "desc" ? "desc" : "asc";
  const q = typeof query.q === "string" && query.q.trim() !== "" ? query.q.trim() : undefined;

  return { page, limit, q, sort, order };
}

export interface MetaPaginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function metaPaginacion(page: number, limit: number, total: number): MetaPaginacion {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  };
}
