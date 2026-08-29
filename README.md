# Documentación Técnica de la Arquitectura del Sistema

**Proyecto:** Wiki & Simulador de Gestión de Procesos y Memoria RAM  
**Stack Principal:** Next.js (App Router, React 19, TypeScript) • MongoDB Atlas • Render PaaS • Tailwind CSS v4  
**Entorno de Producción:** Despliegue continuo en Render Web Service

---

## 1. Visión General y Objetivos Técnicos

Esta aplicación es una plataforma web fullstack modular diseñada con fines académicos y de producción, orientada a dos propósitos principales:
1. **Simulación en Tiempo Real de Gestión de Memoria y Procesos de Sistemas Operativos:** Implementación interactiva de un modelo de asignación contigua de RAM (1024 MB) con algoritmos First-Fit, Best-Fit y Worst-Fit, planificación de cola FIFO y control de fragmentación externa.
2. **Capa de Backend y Persistencia en la Nube:** API REST modular construida sobre Route Handlers de Next.js, conectada a una base de datos NoSQL distribuida (**MongoDB Atlas**) mediante un patrón de conexión Singleton para optimizar el pool de sockets en entornos cloud.

---

## 2. Diagrama y Arquitectura General del Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Navegador)                           │
│  ┌───────────────────────────┐        ┌─────────────────────────────┐  │
│  │   Interfaz Web React 19   │        │   In-Memory State Engine    │  │
│  │   (Tailwind v4 / DarkUI)  │◄──────►│ (Algoritmos RAM, Ticks 1s)  │  │
│  └─────────────┬─────────────┘        └─────────────────────────────┘  │
└────────────────┼───────────────────────────────────────────────────────┘
                 │ Peticiones HTTP / JSON (Fetch)
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVIDOR (Render Web Service)                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Next.js Route Handlers                       │  │
│  │    • /api/health       • /api/status       • /api/items          │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Mongoose Cache Singleton         │
│                                     ▼                                  │
│                          ┌─────────────────────┐                       │
│                          │  Driver / Conexión  │                       │
│                          └──────────┬──────────┘                       │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ TLS / SRV (0.0.0.0/0)
                                      ▼
                      ┌───────────────────────────────┐
                      │    MongoDB Atlas Cluster      │
                      │    (Colecciones NoSQL)        │
                      └───────────────────────────────┘
```

---

## 3. Módulo de Simulación de Memoria (In-Memory State Engine)

### 3.1 Modelo de Espacio de Memoria
* **Capacidad Total:** 1024 MB contiguos (0 MB a 1024 MB).
* **Bloque de Memoria (`MemoryBlock`):** Segmento contiguo definido por `start` (MB), `end` (MB), `size` (MB), bandera booleana `isFree` y referencia al proceso asignado (`SimProcess`).
* **Cálculo de Fragmentación Externa:** El sistema computa dinámicamente el número de huecos libres no adyacentes y el tamaño del bloque libre continuo más grande (`maxContiguousFree`).

### 3.2 Algoritmos de Asignación Contigua
El motor implementa tres estrategias clásicas de asignación dinámica de memoria:

| Algoritmo | Estrategia de Selección de Bloque | Complejidad / Comportamiento |
|---|---|---|
| **First-Fit** | Selecciona el **primer** bloque libre contiguo donde `block.size >= requiredMemory`. | Rápido en búsqueda; tiende a concentrar fragmentación al inicio del espacio de memoria. |
| **Best-Fit** | Evalúa todos los bloques adecuados y selecciona el de **menor capacidad** que cumpla la condición (`min(block.size)`). | Minimiza el residuo del bloque elegido; produce pequeños fragmentos inutilizables a lo largo del tiempo. |
| **Worst-Fit** | Evalúa todos los bloques y selecciona el de **mayor tamaño** disponible (`max(block.size)`). | Deja bloques residuales más grandes y potencialmente reutilizables por otros procesos. |

### 3.3 Ciclo de Vida del Proceso y Planificación
1. **Creación:** Se parametriza el proceso con PID único, nombre descriptivo, memoria RAM requerida (MB) y duración total (segundos).
2. **Evaluación de Admisión:**
   - Si existe un bloque libre contiguo según el algoritmo seleccionado, el proceso transiciona a estado `RUNNING` y se le asigna el rango de direcciones `[start - end] MB`.
   - Si no hay espacio contiguo suficiente (incluso si la memoria libre total acumulada es suficiente), el proceso transiciona a estado `WAITING` y se encola en una **Cola FIFO de Espera**.
3. **Avance del Reloj del Sistema (`Clock Tick`):**
   - El reloj virtual incrementa `currentTick += 1`.
   - Todos los procesos `RUNNING` decrementan concurrentemente su `remainingTime -= 1`.
4. **Desasignación y Promoción:**
   - Al llegar `remainingTime == 0` o mediante terminación forzada (*Kill*), el proceso pasa a estado `COMPLETED` o `TERMINATED`.
   - El espacio de memoria ocupado se libera y se fusiona automáticamente con los bloques libres adyacentes.
   - El planificador evalúa inmediatamente la cola de espera FIFO para admitir a los procesos pendientes que ahora puedan alojarse en los nuevos espacios libres.

### 3.4 Justificación de la Arquitectura In-Memory State
A diferencia de arquitecturas tradicionales que realizan transacciones en disco (por ejemplo SQLite o bases de datos relacionales locales):
* **Cero Latencia I/O:** Cada segundo de simulación se ejecuta a nivel de microsegundos en la memoria RAM del motor V8 del cliente, eliminando cuellos de botella de red y bloqueos de archivo.
* **Aislamiento por Sesión:** Cada usuario que interactúa con la aplicación opera en su propia máquina de estados independiente sin consumir ciclos de CPU ni memoria en el servidor cloud.
* **Fidelidad Semántica:** La memoria RAM física es volátil por definición. Un estado en memoria volátil refleja exactamente el comportamiento real de la arquitectura de computadoras.

---

## 4. Capa de Backend y Persistencia (MongoDB Atlas)

### 4.1 Patrón Singleton de Conexión (`src/lib/mongodb.ts`)
En arquitecturas basadas en Node.js sobre plataformas cloud (como Render) y frameworks con recarga en caliente (Hot Module Replacement), la creación descontrolada de instancias de conexión agota rápidamente el pool de conexiones de la base de datos.

Se implementó un patrón Singleton con almacenamiento en caché en el objeto global de Node.js:
* Si ya existe una promesa de conexión activa o una conexión resuelta (`mongooseCache`), se reutiliza la misma instancia.
* Se establece un límite de conexiones simultáneas (`maxPoolSize: 10`) y un tiempo de espera de selección de servidor de 5000 ms (`serverSelectionTimeoutMS: 5000`).

### 4.2 Modelo de Datos (`src/models/Item.ts`)
Colección de documentos NoSQL para entidades de información general (artículos o notas):
```typescript
interface IItem {
  title: string;       // Requerido, trimmed, máx 120 caracteres
  content: string;     // Requerido, contenido textual
  category: string;    // Opcional, valor por defecto: "General"
  createdAt: Date;     // Timestamp automático de inserción
  updatedAt: Date;     // Timestamp automático de modificación
}
```

---

## 5. Especificación de la API Backend (Route Handlers)

Todos los endpoints están tipados y configurados con `export const dynamic = "force-dynamic"` para evitar respuestas cacheadas estáticamente en compilación.

### 5.1 Health Check
* **Ruta:** `GET /api/health`
* **Propósito:** Endpoint de sondeo para el servicio de monitorización y orquestación de Render.
* **Respuesta Exitosa (200 OK):**
```json
{
  "status": "ok",
  "service": "wiki-nextjs",
  "timestamp": "2026-08-29T04:30:00.000Z",
  "uptime": 124.56,
  "environment": "production"
}
```

### 5.2 Diagnóstico de Base de Datos
* **Ruta:** `GET /api/status`
* **Propósito:** Ejecuta un comando `ping` directo contra el cluster de MongoDB Atlas y mide la latencia de red.
* **Respuesta Exitosa (200 OK):**
```json
{
  "connected": true,
  "databaseName": "wiki",
  "readyState": 1,
  "latencyMs": 42,
  "host": "cluster0.xxxxx.mongodb.net",
  "message": "Conexión a MongoDB Atlas establecida exitosamente."
}
```
* **Respuesta Fallida (503 Service Unavailable / 500 Internal Server Error):** Devuelve detalles del error de red, estado de la URI y recomendaciones de configuración de firewall (IP Access List).

### 5.3 Gestión de Elementos (CRUD)
* **`GET /api/items`:**
  * Parámetros de consulta: `?limit=20` (máximo permitido: 50).
  * Retorna los documentos más recientes ordenados descendientemente por `createdAt`.
* **`POST /api/items`:**
  * Headers: `Content-Type: application/json`
  * Body: `{ "title": string, "content": string, "category"?: string }`
  * Validación: Sanitización de cadenas vacías y verificación de tipos. Retorna `201 Created` con el objeto persistido o `400 Bad Request`.

---

## 6. Infraestructura y Despliegue en Producción (Render)

### 6.1 Especificación de Render Blueprint (`render.yaml`)
El despliegue está formalizado como Infraestructura como Código (IaC) mediante un Blueprint de Render:
```yaml
services:
  - type: web
    name: wiki-app
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm install --include=dev && npm run build
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 24.19.0
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
```

### 6.2 Consideraciones de Compilación en Cloud
* **Inclusión de dependencias de construcción:** Con `NODE_ENV=production`, `npm install` excluye por defecto las herramientas de desarrollo. El comando `npm install --include=dev` y la reubicación de `@tailwindcss/postcss`, `tailwindcss` y `typescript` en el bloque principal de dependencias garantizan compilaciones limpias y reproducibles en los contenedores de Render.
* **Detección Dinámica de Puertos:** El servidor Next.js en producción enlaza automáticamente el puerto provisto en la variable de entorno `PORT` inyectada dinámicamente por la infraestructura de Render.

---

## 7. Frontend, Estado y Sistema de Diseño

* **React 19 & Next.js App Router:** Componentes de servidor (`Server Components`) para layouts y metadatos, y componentes de cliente (`"use client"`) optimizados para reactividad.
* **Sincronización de Tema (Modo Claro / Modo Oscuro):**
  - Implementado mediante `useSyncExternalStore` con un `MutationObserver` sobre el elemento raíz `<html>`.
  - Script inline de precarga en `<head>` para evitar parpadeos (*Flash of Unstyled Content - FOUC*).
  - Persistencia en `localStorage` con respaldo automático en `prefers-color-scheme`.
* **Tailwind CSS v4:** Estilos atómicos con variante `@custom-variant dark (&:where(.dark, .dark *))` y tokens CSS dinámicos para transiciones visuales de color a 0.25s.
