import { createServer } from "node:http";

const puerto = Number(process.env.PORT ?? 3000);

const servidor = createServer((solicitud, respuesta) => {
  respuesta.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  if (solicitud.method === "GET" && solicitud.url === "/salud") {
    respuesta.writeHead(200);
    respuesta.end(
      JSON.stringify({
        estado: "ok",
        fecha: new Date().toISOString()
      })
    );
    return;
  }

  const url = new URL(solicitud.url, "http://localhost");
  if (solicitud.method === "GET" && url.pathname === "/api/v1/info") {
    respuesta.writeHead(200);
    respuesta.end(
      JSON.stringify({
        nombre: "Mi primer backend",
        version: "1.0.0"
      })
    );
    return;
  }

  respuesta.writeHead(404);
  respuesta.end(
    JSON.stringify({
      error: "Recurso no encontrado"
    })
  );
});

servidor.listen(puerto, () => {
  console.log(`Servidor disponible en http://localhost:${puerto}`);
});
