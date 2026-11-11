import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { Express } from "express";
import type { Response } from "supertest";
import { crearApp } from "../../src/app.js";
import { crearBaseDeDatos } from "../../src/db/sqlite.js";

export class ApiWorld extends World {
  app!: Express;
  lastResponse?: Response;
  lastProductId?: number;
  lastOrderId?: number;

  crearApi(): void {
    this.app = crearApp({ db: crearBaseDeDatos(":memory:") });
  }
}

setWorldConstructor(ApiWorld);
