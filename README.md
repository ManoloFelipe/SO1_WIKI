# Documentación Técnica de la Arquitectura del Sistema

**Proyecto:** Wiki & Simulador de Sistemas Operativos (Gestión de Memoria RAM y Concurrencia)  
**Stack Principal:** Next.js (App Router, React 19, TypeScript) • MongoDB Atlas • Render PaaS • Python 3 • Tailwind CSS v4  
**Despliegue en Producción:** [https://www.mfelipe.tech/wiki](https://www.mfelipe.tech/wiki)  
**Entorno de Alojamiento:** Render Web Service con subruta configurada (`/wiki`)

---

## 1. Visión General y Objetivos Técnicos

Esta aplicación es una plataforma web fullstack modular diseñada con fines académicos y de producción para la cátedra de Sistemas Operativos, orientada a tres componentes fundamentales:
1. **Wiki y Capa de Persistencia NoSQL (MongoDB Atlas):** Base de conocimientos colaborativa y API REST modular construida sobre Route Handlers de Next.js, conectada a MongoDB Atlas mediante un patrón Singleton de conexión que optimiza el pool de sockets en entornos cloud.
2. **Simulación en Tiempo Real de Gestión de Memoria y Procesos (Laboratorio I):** Implementación interactiva de un modelo de asignación contigua de RAM (1024 MB) con algoritmos First-Fit, Best-Fit y Worst-Fit, planificación con cola FIFO y cálculo dinámico de fragmentación externa.
3. **Motor de Transacciones Concurrentes y Detección de Deadlock (Laboratorio II):** Demostración en tiempo real con backend multihilo en Python utilizando hilos nativos del sistema operativo (TIDs), sincronización mediante Locks y Monitor Condition, visualización del Grafo de Asignación de Recursos (RAG), detección de ciclos por DFS y recuperación cooperativa frente a interbloqueos de Coffman.

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

### 6.3 Dominio en Producción y Enrutamiento Base (`basePath`)
* **URL Pública Oficial:** [https://www.mfelipe.tech/wiki](https://www.mfelipe.tech/wiki)
* **Configuración de Subruta (`basePath`):** Para servir la aplicación dentro del path unificado `/wiki` del dominio corporativo, `next.config.ts` declara explícitamente:
  ```typescript
  const nextConfig: NextConfig = {
    basePath: "/wiki",
  };
  ```
  Esto garantiza que todos los assets estáticos, bundles de scripts, fuentes tipográficas y rutas internas de la API REST se sirvan con el prefijo `/wiki` de forma transparente.

---

## 7. Frontend, Estado y Sistema de Diseño

* **React 19 & Next.js App Router:** Componentes de servidor (`Server Components`) para layouts y metadatos, y componentes de cliente (`"use client"`) optimizados para reactividad.
* **Sincronización de Tema (Modo Claro / Modo Oscuro):**
  - Implementado mediante `useSyncExternalStore` con un `MutationObserver` sobre el elemento raíz `<html>`.
  - Script inline de precarga en `<head>` para evitar parpadeos (*Flash of Unstyled Content - FOUC*).
  - Persistencia en `localStorage` con respaldo automático en `prefers-color-scheme`.
* **Tailwind CSS v4:** Estilos atómicos con variante `@custom-variant dark (&:where(.dark, .dark *))` y tokens CSS dinámicos para transiciones visuales de color a 0.25s.

---

## 8. Proyecto 2 / Laboratorio II: Motor de Transacciones Concurrentes

Implementación del motor en tiempo real que demuestra la sincronización de hilos reales del sistema operativo, condiciones de carrera, interbloqueos genuinos según las 4 condiciones de Coffman, y recuperación mediante el Grafo de Asignación de Recursos (RAG) con DFS.

### 8.1 Componentes del Motor Python (`python_engine/`)
* **Hilos Reales del SO (`threading.Thread`):** Cada trabajador y el guardián son hilos nativos identificables mediante su **TID** (`threading.get_native_id()`) y el **PID** del proceso (`os.getpid()`).
* **Cuentas y Recursos:** Cuentas A, B y C con saldos en enteros e invariante de conservación $S = A + B + C = 3000$.
* **Exclusión Mutua:** Un `threading.Lock()` exclusivo por cada cuenta para proteger las secciones críticas compuestas.
* **Monitor Coordinador (`threading.Condition` con `threading.RLock`):** Controla el registro de propietarios y esperas de forma atómica y consistente, permitiendo esperas cancelables sin bloquear el monitor.
* **Grafo de Asignación de Recursos (RAG):** Representación dirigida de posesión ($R \rightarrow T$) y de espera ($T \rightarrow R$).
* **Detección de Ciclos por DFS:** Búsqueda en profundidad sobre listas de adyacencia para identificar el ciclo $T1 \rightarrow B \rightarrow T2 \rightarrow A \rightarrow T1$ y resaltar las aristas en rojo en el frontend SVG.
* **Cancelación Cooperativa de Víctima:** El guardián notifica a T2 vía la `Condition`. T2 despierta, retira su solicitud y libera su propio lock de B en su bloque `finally`. T1 completa su operación y el saldo se conserva intacto en 3000.

### 8.2 Escenarios de Demostración
1. **Modo Normal:** Transferencias concurrentes siguiendo un orden alfabético estricto de adquisición (A antes que B, B antes que C). Previene esperas circulares.
2. **Condición de Carrera Controlada:**
   * *Desprotegida:* Una `threading.Barrier(2)` sincroniza a T1 y T2 para que ambos lean $A = 1000$ antes de escribir. Una escritura sobrescribe a la otra, y la suma total pasa a 3100 o 3200 (invariante roto).
   * *Protegida:* Con locks ordenados, se garantiza exclusión mutua, $A = 700$ y el total se conserva en 3000.
3. **Interbloqueo Caótico (Coffman):** T1 retiene A y pide B; T2 retiene B y pide A. Sincronizado con `Barrier(2)` tras el primer lock. Detección automática del ciclo por DFS.
4. **Recuperación Cooperativa:** Guardián cancela a T2, T2 libera B en `finally`, T1 termina, ciclo desaparece y $S = 3000$.

### 8.3 Ejecución del Motor Concurrente
Para ejecutar el servidor localmente o en un servidor Linux/Azure:
```bash
# Iniciar servidor backend en Python (puerto 8000)
npm run engine
# O directamente:
py python_engine/server.py
```

Para ejecutar la suite de pruebas CLI del motor:
```bash
npm run engine:test
# O directamente:
py -u python_engine/test_cli.py
```

### 8.4 Comandos de Evidencia en Linux / Azure
Durante la ejecución del servidor o cuando se inyecta el interbloqueo, se puede comprobar la presencia de hilos reales del SO con los siguientes comandos en la terminal de Linux (sustituyendo `<PID>` por el PID observado en la interfaz):
```bash
# Listar todos los hilos nativos y sus TIDs
ps -L -p <PID>

# Inspeccionar las tareas del kernel de Linux
ls -l /proc/<PID>/task

# Monitorear hilos en tiempo real
top -H -p <PID>
```
En Windows (PowerShell):
```powershell
Get-Process -Id <PID> | Select-Object -ExpandProperty Threads
```

---

## 9. Disclaimer / Aviso

> 🤖 **Nota de autoría y herramientas:**  
> Este proyecto fue desarrollado y estructurado con el apoyo de **Google Antigravity** como asistente y entorno avanzado de inteligencia artificial para la generación de código, diseño arquitectónico y optimización de software.


