# Wiki Fullstack: Next.js + MongoDB Atlas + Render

Plantilla integral de inicio rápido preparada para desarrollo fullstack con **Next.js (App Router)**, conexión robusta a **MongoDB Atlas** (optimizada para aprovechar los beneficios del **GitHub Student Developer Pack**) y lista para desplegar en **Render** con un solo clic.

---

## 🚀 Características Principales

- **Frontend Moderno**: Next.js (versión más reciente con App Router), TypeScript y Tailwind CSS.
- **Backend Integrado**: Route Handlers en `src/app/api/...` para lógica de negocio y operaciones de base de datos.
- **MongoDB Atlas & Mongoose**:
  - Conexión con patrón Singleton/Cache en `src/lib/mongodb.ts` para prevenir fugas de sockets en hot-reload y entornos cloud.
  - Modelo tipado `src/models/Item.ts`.
  - Endpoint de comprobación de salud y latencia `GET /api/status`.
  - Operaciones CRUD de ejemplo en `GET` y `POST /api/items`.
- **Listo para Render**:
  - Archivo `render.yaml` (Render Blueprint) para despliegue automatizado.
  - Endpoint `/api/health` listo para el health check de Render.
  - Compatible con el puerto dinámico de Render (`PORT`).

---

## 📋 Estructura del Proyecto

```text
├── render.yaml               # Blueprint de infraestructura como código para Render
├── .env.example              # Plantilla documentada de variables de entorno
├── .env.local                # Tu archivo local de variables (ignorado en Git)
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── health/       # Health check para Render
    │   │   ├── status/       # Diagnóstico y ping a MongoDB Atlas
    │   │   └── items/        # Endpoints CRUD de ejemplo
    │   ├── layout.tsx        # Layout principal de la aplicación
    │   ├── page.tsx          # Dashboard interactivo con comprobación en vivo
    │   └── globals.css       # Estilos globales con Tailwind CSS
    ├── lib/
    │   └── mongodb.ts        # Singleton de conexión Mongoose
    └── models/
        └── Item.ts           # Esquema y modelo de Mongoose
```

---

## 🎓 1. Configurar MongoDB Atlas (GitHub Student Pack)

El **GitHub Student Developer Pack** incluye acceso gratuito y créditos en **MongoDB Atlas**:

1. **Canjear el beneficio**:
   - Accede a [education.github.com/pack](https://education.github.com/pack).
   - Busca la sección de **MongoDB** y sigue el enlace para reclamar tus créditos de estudiante ($50 - $200) o crear tu cuenta gratuita de MongoDB Atlas.
2. **Crear tu Cluster**:
   - En el panel de MongoDB Cloud, pulsa **Create a Deployment**.
   - Puedes seleccionar el cluster **M0 Sandbox** (gratuito de por vida) o usar tus créditos para un cluster **M2/M5**.
3. **Crear un Usuario de Base de Datos**:
   - En el menú lateral izquierdo, ve a **Security > Database Access**.
   - Haz clic en **Add New Database User**.
   - Elige método **Password**, escribe un usuario y una contraseña segura, y asígnale el rol de **Read and write to any database**. Guarda estas credenciales.
4. **Permitir Conexiones de Red (Indispensable para Render)**:
   - Ve a **Security > Network Access**.
   - Haz clic en **Add IP Address**.
   - Selecciona **Allow Access From Anywhere** (`0.0.0.0/0`) y confirma.
     > *Nota: Render asigna IPs dinámicas en su capa gratuita, por lo que es necesario habilitar `0.0.0.0/0` para que el servidor de Render pueda comunicarse con Atlas.*
5. **Obtener la Cadena de Conexión (URI)**:
   - Ve a **Database** (Deployments).
   - Haz clic en **Connect** > **Drivers** (Node.js).
   - Copia la URL que luce similar a:
     ```text
     mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/wiki?retryWrites=true&w=majority
     ```
   - Reemplaza `<usuario>` y `<password>` por los que creaste en el paso 3.

---

## 💻 2. Ejecutar Localmente

1. Crea o edita tu archivo `.env.local` en la raíz del proyecto y pega tu URI:
   ```env
   MONGODB_URI=mongodb+srv://mi_usuario:mi_password@cluster0.xxxxx.mongodb.net/wiki?retryWrites=true&w=majority
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
   - Verás el indicador verde de **MongoDB Conectado** junto con la latencia en milisegundos.
   - Podrás crear y listar registros directamente en tu base de datos mediante el formulario interactivo.

---

## ☁️ 3. Desplegar en Render

Este proyecto está 100% configurado para desplegarse en **Render**.

### Opción A: Despliegue con Render Blueprints (Recomendado)

1. Sube tu proyecto a un repositorio de GitHub:
   ```bash
   git add .
   git commit -m "Inicializar proyecto wiki fullstack con mongodb y render"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repositorio.git
   git push -u origin main
   ```
2. Entra a tu cuenta en [dashboard.render.com](https://dashboard.render.com).
3. Haz clic en el botón **New +** arriba a la derecha y selecciona **Blueprint**.
4. Conecta tu repositorio de GitHub.
5. Render detectará automáticamente el archivo `render.yaml`.
6. En la pantalla de configuración, te solicitará el valor para `MONGODB_URI`. Pega allí tu cadena de conexión de MongoDB Atlas.
7. Haz clic en **Apply**. ¡Render compilará y desplegará tu aplicación automáticamente!

### Opción B: Despliegue Manual como Web Service

Si prefieres crearlo manualmente:
1. En Render, pulsa **New +** > **Web Service**.
2. Conecta tu repositorio.
3. Configura:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/health`
4. En la sección **Environment Variables**, añade:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://...`
5. Haz clic en **Create Web Service**.

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check liviano para monitorización y uptime en Render |
| `GET` | `/api/status` | Realiza un ping a MongoDB Atlas y devuelve el estado y latencia |
| `GET` | `/api/items` | Devuelve la lista de los últimos elementos creados en la base de datos |
| `POST` | `/api/items` | Inserta un nuevo elemento en la colección de MongoDB |

---

## 🛠️ Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: Compila la aplicación para producción y valida tipos TypeScript.
- `npm run start`: Inicia el servidor de producción (compatible con el puerto `PORT` de Render).
- `npm run lint`: Ejecuta ESLint para verificar calidad de código.
