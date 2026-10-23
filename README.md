

# JC Ebanistería y Metal - Backend

API del sistema web para gestionar los pedidos de JC Ebanistería y Metal, un taller colombiano con más de 20 años de trabajo en muebles de madera (closets, cocinas, puertas) y piezas metálicas (rejas, puertas y ventanas).

Este repositorio es solo el backend. El frontend (HTML, CSS y JS) va por separado.

## Qué hace

- Registra pedidos con sus productos y calcula el presupuesto.
- Guarda cotizaciones y el material que se gasta en cada pedido, y descuenta ese material del inventario.
- Lleva un historial de cada cambio de estado, con una nota opcional.
- Le da a cada pedido un enlace único para que el cliente vea cómo va su trabajo sin tener que crear una cuenta.
- Si se borra un pedido, devuelve al inventario el material que ya se había descontado.

## Tecnologías

- Node.js y Express
- PostgreSQL (librería `pg`)
- Postman / Thunder Client para las pruebas


## Cómo correrlo

Necesitas Node.js y una base de datos PostgreSQL ya creada.

```bash
git clone https://github.com/Valew7/jc-ebanisteria-backend.git
cd jc-ebanisteria-backend
npm install
```


Después arranca el servidor:

```bash
node index.js
```

Debe aparecer "Servidor corriendo en http://localhost:3000" y "Conexión exitosa a PostgreSQL".

## Base de datos

Las tablas que usa el sistema son `cliente`, `usuario`, `producto_servicio`, `pedido`, `detalle_pedido`, `cotizacion`, `material`, `material_usado` e `historial_estado`.

Cada pedido tiene una columna `codigoseguimiento`: un texto aleatorio de 32 caracteres que se genera al crearlo y es lo que va en el enlace del cliente.

La aplicación se conecta con un usuario que solo tiene los permisos que necesita. Si agregas una tabla nueva, acuérdate de darle permisos a ese usuario con `GRANT`, porque si no la API responde "permiso denegado".

## Endpoints

### Pedidos

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/pedidos` | Lista todos los pedidos |
| GET | `/api/pedidos/:id` | Un pedido con sus productos |
| POST | `/api/pedidos` | Crea un pedido con sus detalles |
| PUT | `/api/pedidos/:id/estado` | Cambia el estado y guarda la nota en el historial |
| DELETE | `/api/pedidos/:id` | Elimina el pedido y devuelve el material al inventario |
| GET | `/api/pedidos/:id/presupuesto` | Calcula el total del pedido |

Los estados válidos son `cotizado`, `en proceso`, `terminado` y `entregado`.

Ejemplo para crear un pedido:

```json
{
  "idcliente": 1,
  "idusuario": 1,
  "detalles": [
    { "idproducto": 1, "cantidad": 1, "preciounitario": 100000 }
  ]
}
```

Ejemplo para cambiar el estado:

```json
{
  "estado": "en proceso",
  "nota": "Ya está lijado, falta barniz",
  "idusuario": 1
}
```

La nota no puede pasar de 200 caracteres.

### Cotizaciones y material usado

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/cotizaciones` | Crea una cotización para un pedido |
| POST | `/api/materialusado` | Registra material usado y lo descuenta del stock |


### Seguimiento público

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/publico/seguimiento/:codigo` | Estado, productos e historial del pedido |

Esta ruta no pide login. Solo devuelve el estado, la fecha del pedido, los productos con su cantidad y el historial. No muestra el número del pedido, datos del cliente ni precios. Si el código no existe o no tiene el formato correcto, responde 404 con el mismo mensaje en los dos casos.

Ojo con las notas del historial: el cliente las ve tal cual se escriben.

## Pruebas

Las pruebas se hicieron a mano con Thunder Client y Postman. Los casos revisados:

- Estado inválido en un pedido (400).
- Pedido sin cliente (400) y con cliente que no existe (404).
- Borrar un pedido con material usado: el stock vuelve al valor anterior.
- Cambio de estado con nota: aparece una fila nueva en `historial_estado`.
- Seguimiento con un código real (200) y con uno falso (404).

## Estructura

```
config/        conexión a la base de datos
controllers/   la lógica de cada recurso
routes/        las rutas de la API
index.js       arranque del servidor
```

## Final

Proyecto de grado
