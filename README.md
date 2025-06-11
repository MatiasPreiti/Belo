<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">Proyecto realizado por Matias Preiti en <a href="http://nodejs.org" target="_blank">Nest JS</a> para Belo.</p>
    <p align="center">
<a href="https://www.linkedin.com/in/matias-oscar-preiti/" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Linkedin Matias Preiti" /></a>
</p>

## Description

Proyecto desarrollado en NestJS por Matias Preiti, para Belo, enfocado en simular un sistema de transacciones financieras. Incluye gestión de usuarios, autenticación JWT y un robusto sistema de manejo de transacciones con registro de intentos fallidos.

## Project Setup

Para evitar conflictos de versiones de dependencias, es crucial ejecutar la instalación con el flag --legacy-peer-deps.

Bash

---

#### $ npm install --legacy-peer-deps

---

Importante: Configuración del Entorno
Después de la instalación, debes crear un archivo .env en la raíz del proyecto. Un ejemplo (.env.example) está disponible como guía. Asegúrate de configurar las variables de entorno, especialmente las de la base de datos, para que coincidan con tu configuración de PostgreSQL.

Compile and Run the Project
Antes de iniciar el proyecto, asegúrate de que PostgreSQL esté en ejecución y accesible en el host y puerto especificados en tu .env. No es necesario crear la base de datos o las tablas manualmente; el proyecto lo hará por ti.

Iniciar el Proyecto (Modo Desarrollo):

Bash

---

#### $ npm run start:dev

---

Al ejecutar este comando por primera vez (o después de eliminar la base de datos), el proyecto:

Creará automáticamente la base de datos belo (o el nombre especificado en DB_NAME).
Creará las tablas users y transactions
Insertará datos de prueba iniciales (incluyendo un usuario administrador con una contraseña hasheada).
Ejecutar Pruebas (con Cobertura):

Bash

$ npm run test:cov

#### Cobertura de Tests

- se crearon test unitarios para los modulos user, auth y transactions. Se aclara que por cuestion de tiempo del challenge no se llego a realizar completamente los test del modulo transactions.

## Using the Project

Una colección de Postman (o similar) en formato JSON se encuentra en la raíz del proyecto para facilitar las pruebas. Asegúrate de verificar y ajustar la URL base del proyecto en tu herramienta (http://localhost:3000 por defecto).

Además, el proyecto está documentado con Swagger, accesible desde:

Swagger UI: http://localhost:3000/api
Swagger JSON: http://localhost:3000/api-json

---

## Al crearse los datos automaticamente en la DB se agregaron usuario ya de base

### Usuario ADMIN

### user: admin@admin.com'

### pass: admin

### Usuarios de prueba

### juan.perez@example.com

### maria.lopez@example.com

### carlos.gonzalez@example.com

### password para todos clave123

---

Gestión de Usuarios y Autenticación
Autenticación JWT: Implementada para proteger los endpoints.
Roles de Usuario: Soporte para diferentes roles (ej. user, admin).
Creación de Usuario Admin: El script de inicialización de la DB inserta un usuario administrador pre-hasheado para facilitar las pruebas. No es posible crear usuarios con rol admin a través del endpoint de registro público.
Sistema de Transacciones Robusto
Bloqueo Pesimista: Utiliza SELECT ... FOR UPDATE para asegurar la consistencia del saldo en transacciones concurrentes.
Validaciones Completas: Incluye validaciones para saldo insuficiente, transacciones a la misma cuenta, y concurrencia de transacciones pendientes.
Registro de Intentos Fallidos: Cualquier intento de transacción que no cumpla con las validaciones o falle por un error interno será registrado en la base de datos con el estado REJECTED y un rejectedReason detallando el motivo del fallo.
Manejo de Transacciones Condicionales: Las transacciones de hasta $50,000 se confirman automáticamente; montos mayores quedan como PENDING.
Guía de Endpoints de la API
Esta sección detalla los principales endpoints disponibles, su propósito, cómo utilizarlos y los requisitos de autenticación/autorización.

## Autenticación y Gestión de Usuarios

### POST /auth/register - Registro de Nuevo Usuario

Descripción: Permite crear una nueva cuenta de usuario en el sistema.
Acceso: Público (no requiere autenticación).
Request Body (JSON):
JSON

Respuestas: 201 Created (Usuario creado exitosamente), 400 Bad Request (Datos inválidos o usuario ya existente).
Notas: Al registrarse, el rol por defecto del usuario será 'user'.

---

### POST /auth/login - Inicio de Sesión y Obtención de Token JWT

Descripción: Autentica a un usuario existente y, si las credenciales son correctas, devuelve un token de acceso JWT. Este token debe ser utilizado en los Authorization Headers de futuras solicitudes a endpoints protegidos.
Acceso: Público (no requiere autenticación).
Request Body (JSON):
JSON

{
"email": "string", // Ejemplo: "user@example.com"
"password": "string" // Ejemplo: "strongPassword123"
}
Respuestas: 200 OK (Login exitoso, devuelve el token JWT), 401 Unauthorized (Credenciales inválidas).
Cómo usar el token: Incluye el token en el encabezado Authorization de tus solicitudes de la siguiente manera: Authorization: Bearer YOUR_JWT_TOKEN.
Endpoints de Salud del Servicio

---

### GET / - Health Check Básico

Descripción: Un endpoint simple para verificar si el servicio está operativo.
Acceso: Público.
Respuestas: 200 OK con un mensaje de "Ok".

---

### GET /info - Información del Microservicio

Descripción: Muestra detalles sobre el microservicio, como autor, fecha, entorno y versión.
Acceso: Público.
Respuestas: 200 OK con un objeto HealthDto.
Gestión de Transacciones (Protegidos por JWT)
Todos los endpoints de /transactions requieren un token JWT válido en el encabezado Authorization.

---

### POST /transactions - Crear una Nueva Transacción

Descripción: Permite al usuario autenticado iniciar una nueva transacción. El ID del usuario de origen se toma directamente del token JWT. La transacción se registrará como CONFIRMED si el monto es &lt;= 50000, o PENDING si es mayor. Los intentos fallidos se registran como REJECTED.
Acceso: Protegido (requiere token JWT válido).
Request Body (JSON):
JSON

{
"destinationUserId": 2, // ID del usuario que recibe
"amount": 10000.5 // Monto a transferir
}
Respuestas: 201 Created (Retorna el objeto de la transacción, con su status (confirmed, pending, rejected) y rejectedReason si aplica).

---

### GET /transactions - Obtener Transacciones de un Usuario

Descripción: Recupera una lista de transacciones asociadas a un usuario específico, ya sea como origen o destino.
Acceso: Protegido (requiere token JWT válido).
Parámetros de Consulta (Query Parameters):
userId (number, requerido): El ID del usuario para el cual se buscan transacciones.
Respuestas: 200 OK (Lista de transacciones), 401 Unauthorized (Si el token no es válido o está ausente), 404 Not Found (Si el usuario no existe).

---

### PATCH /transactions/{id}/approve - Aprobar una Transacción Pendiente

Descripción: Permite aprobar una transacción que se encuentra en estado PENDING, realizando el movimiento de fondos.
Acceso: Protegido (requiere token JWT válido).
Parámetros de Ruta:
id (number, requerido): El ID de la transacción a aprobar.
Respuestas: 200 OK (Transacción aprobada), 404 Not Found (Transacción no encontrada), 400 Bad Request (Transacción no está pendiente o saldo insuficiente), 500 Internal Server Error (Fallo interno).

---

### PATCH /transactions/{id}/reject - Rechazar una Transacción Pendiente

Descripción: Permite rechazar una transacción que se encuentra en estado PENDING.
Acceso: Protegido (requiere token JWT válido).
Parámetros de Ruta:
id (number, requerido): El ID de la transacción a rechazar.
Respuestas: 200 OK (Transacción rechazada), 404 Not Found (Transacción no encontrada), 400 Bad Request (Transacción no está pendiente), 500 Internal Server Error (Fallo interno).
Gestión de Usuarios (Ejemplos, el acceso puede variar según tu lógica de roles)

---

### GET /users - Obtener Todos los Usuarios

Descripción: Recupera una lista de todos los usuarios registrados.
Acceso: Protegido (requiere token JWT válido, probablemente solo para administradores).
Respuestas: 200 OK (Lista de usuarios).

---

### GET /users/{id} - Obtener un Usuario por ID

Descripción: Recupera los detalles de un usuario específico por su ID.
Acceso: Protegido (requiere token JWT válido, probablemente para administradores o el propio usuario).
Parámetros de Ruta: id (number, requerido): El ID del usuario.
Respuestas: 200 OK (Detalles del usuario).

---

### PUT /users/{id} - Actualizar un Usuario

Descripción: Actualiza los detalles de un usuario existente.
Acceso: Protegido (requiere token JWT válido, probablemente para administradores o el propio usuario).
Parámetros de Ruta: id (number, requerido): El ID del usuario a actualizar.
Request Body (JSON): Contiene los campos a actualizar del usuario (ej. email, account).
Respuestas: 200 OK (Usuario actualizado exitosamente).
Stay in touch
Author - Matias Preiti
