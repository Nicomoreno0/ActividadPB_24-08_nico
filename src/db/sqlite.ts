import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export type SqliteDatabase = Database.Database;

export function crearBaseDeDatos(ruta = "data/app.db"): SqliteDatabase {
  if (ruta !== ":memory:") {
    mkdirSync(dirname(ruta), { recursive: true });
  }

  const db = new Database(ruta);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      cliente TEXT NOT NULL,
      estado TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );
  `);

  return db;
}
