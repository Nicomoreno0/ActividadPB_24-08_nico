import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "El cuerpo debe ser un JSON válido",
        details: []
      }
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error interno",
      details: []
    }
  });
};
