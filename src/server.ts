import "dotenv/config";
import { crearApp } from "./app.js";

const puerto = Number(process.env.PORT ?? 3000);
const app = crearApp();

app.listen(puerto, () => {
  console.log(`Servidor disponible en http://localhost:${puerto}`);
  console.log(`Documentación OpenAPI: http://localhost:${puerto}/api/docs`);
});
