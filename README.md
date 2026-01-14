# API de Procesamiento de Imágenes

API REST desarrollada en **Node.js + TypeScript** para el procesamiento de imágenes mediante operaciones encadenables (pipeline), protegida con autenticación JWT y con registro de auditoría.

---

## 🚀 Funcionalidades

- Redimensionar imágenes (`resize`)
- Rotar imágenes (`rotate`)
- Aplicar filtros (`blur`, `sharpen`, `grayscale`)
- Convertir formato (`jpeg`, `png`, `webp`)
- Ejecutar **pipelines dinámicos** de operaciones
- Autenticación JWT
- Logging estructurado en archivo

---

## 🧠 Arquitectura General

La API está construida siguiendo principios de **arquitectura limpia** y patrones de diseño:

- **Strategy Pattern** para las operaciones de imagen
- **Factory Pattern** para resolver operaciones dinámicamente
- **Decorator Pattern** para autenticación y logging
- **Pipeline Pattern** para encadenar operaciones
- **Separation of Concerns** entre HTTP, lógica de negocio y utilidades

---

## 📂 Estructura del Proyecto

src/
├── routes/ # Endpoints HTTP
├── services/ # Lógica de negocio
│ └── operations/ # Operaciones de imagen (Strategy)
├── handlers/ # Orquestación de operaciones
├── decorators/ # Auth y Logging
├── logging/ # Logger a archivo
├── middleware/ # Multer, auth
├── models/ # Modelos de datos
├── errors/ # Manejo de errores
├── types/ # Tipos compartidos

---

## 🔐 Autenticación

Todos los endpoints de imágenes requieren un token JWT:

Authorization: Bearer <TOKEN>

El token se obtiene mediante:

POST /auth/login

---

## 🖼️ Endpoints Disponibles

### POST /images/resize
Redimensiona una imagen.

### POST /images/rotate
Rota una imagen (90, 180, 270).

### POST /images/filter
Aplica un filtro (`blur`, `sharpen`, `grayscale`).

### POST /images/format
Convierte el formato de la imagen.

### POST /images/process
Ejecuta un **pipeline de operaciones** en orden.

---

## 🧪 Ejemplo de Pipeline

```json
[
  { "op": "resize", "width": 400, "height": 400 },
  { "op": "rotate", "angle": 90 },
  { "op": "filter", "filter": "grayscale" },
  { "op": "format", "format": "png" }
]
