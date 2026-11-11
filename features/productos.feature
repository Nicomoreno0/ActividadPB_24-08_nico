# language: es
Característica: CRUD de productos
  Para administrar el catálogo de la API
  Como cliente HTTP
  Quiero crear, consultar, actualizar y eliminar productos

  Antecedentes:
    Dado una API con base de datos vacía

  Escenario: Crear un producto con datos válidos
    Cuando envío POST "/api/v1/productos" con:
      """
      {"nombre":"Jabón líquido","precio":1800,"stock":15,"categoria":"limpieza"}
      """
    Entonces el código de estado es 201
    Y el campo "data.nombre" es "Jabón líquido"

  Escenario: Crear un producto sin nombre
    Cuando envío POST "/api/v1/productos" con:
      """
      {"precio":1800,"stock":15,"categoria":"limpieza"}
      """
    Entonces el código de estado es 422

  Escenario: Consultar un id existente
    Dado un producto creado con nombre "Aceite de oliva"
    Cuando consulto el último producto por id
    Entonces el código de estado es 200
    Y el campo "data.nombre" es "Aceite de oliva"

  Escenario: Consultar un id inexistente
    Cuando envío GET "/api/v1/productos/99"
    Entonces el código de estado es 404

  Escenario: Consultar un id inválido
    Cuando envío GET "/api/v1/productos/cero"
    Entonces el código de estado es 400

  Escenario: Modificar un campo válido
    Dado un producto creado con nombre "Fideos"
    Cuando actualizo parcialmente el último producto con:
      """
      {"stock":3}
      """
    Entonces el código de estado es 200

  Escenario: Eliminar un recurso existente
    Dado un producto creado con nombre "Sal fina"
    Cuando elimino el último producto
    Entonces el código de estado es 204

  Escenario: Aplicar un filtro
    Dado un producto creado con nombre "Gaseosa cola"
    Cuando envío GET "/api/v1/productos?q=gaseosa"
    Entonces el código de estado es 200
    Y la colección contiene 1 elemento

  Escenario: Solicitar una página inexistente
    Dado un producto creado con nombre "Harina"
    Cuando envío GET "/api/v1/productos?page=8&limit=10"
    Entonces el código de estado es 200
    Y la colección está vacía
    Y los metadatos indican total 1

  Escenario: Invocar una ruta desconocida
    Cuando envío GET "/api/v1/inventario"
    Entonces el código de estado es 404
