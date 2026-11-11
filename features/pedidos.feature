# language: es
Característica: CRUD de pedidos
  Para registrar ventas sobre productos
  Como cliente HTTP
  Quiero administrar pedidos y consultarlos por id

  Antecedentes:
    Dado una API con base de datos vacía
    Y un producto creado con nombre "Yerba mate"

  Escenario: Crear un pedido válido
    Cuando envío POST "/api/v1/pedidos" con el producto reciente:
      """
      {"cantidad":2,"cliente":"Carlos Díaz"}
      """
    Entonces el código de estado es 201
    Y el campo "data.estado" es "pendiente"

  Escenario: Consultar un pedido por id
    Dado un pedido creado para "Lucía Fernández"
    Cuando consulto el último pedido por id
    Entonces el código de estado es 200
    Y el campo "data.cliente" es "Lucía Fernández"

  Escenario: Crear un pedido sin stock suficiente
    Cuando envío POST "/api/v1/pedidos" con el producto reciente:
      """
      {"cantidad":999,"cliente":"Carlos Díaz"}
      """
    Entonces el código de estado es 422
