import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { after, before, test } from "node:test";

let proceso;
let urlBase;

async function obtenerPuertoDisponible() {
  const servidorTemporal = createNetServer();
  await new Promise((resolve, reject) => {
    servidorTemporal.once("error", reject);
    servidorTemporal.listen(0, "127.0.0.1", resolve);
  });
  const { port } = servidorTemporal.address();
  await new Promise((resolve, reject) => {
    servidorTemporal.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

before(async () => {
  const puerto = await obtenerPuertoDisponible();
  urlBase = `http://127.0.0.1:${puerto}`;
  proceso = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(puerto) },
    stdio: "ignore"
  });

  for (let intento = 0; intento < 50; intento += 1) {
    if (proceso.exitCode !== null) {
      throw new Error(`El servidor terminó con código ${proceso.exitCode}`);
    }
    try {
      const respuesta = await fetch(`${urlBase}/salud`);
      if (respuesta.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error("El servidor no inició a tiempo");
});

after(() => {
  proceso?.kill();
});

test("GET /api/v1/info devuelve el nombre y la versión del backend", async () => {
  const respuesta = await fetch(`${urlBase}/api/v1/info`);

  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await respuesta.json(), {
    nombre: "Mi primer backend",
    version: "1.0.0"
  });
});