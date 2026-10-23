"""
Generador de Documento HTML y PDF Profesional para la Defensa del Proyecto.
Convierte el contenido técnico en un PDF de alta calidad con portada formal,
diagramas visuales de arquitectura, formato para impresión A4 y estilos ejecutivos.
"""

import os
import subprocess

HTML_CONTENT = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Defensa de Proyecto - Sistemas Operativos 1 - UMG</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 18mm 15mm 18mm 15mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 10.5pt;
    }

    /* =========================================================================
       PORTADA FORMAL
       ========================================================================= */
    .cover {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 92vh;
      padding: 40px 30px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      position: relative;
    }

    .cover-header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 25px;
    }

    .cover-institution {
      font-size: 14pt;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-faculty {
      font-size: 11pt;
      font-weight: 500;
      color: #475569;
      margin-top: 4px;
    }

    .cover-course {
      display: inline-block;
      margin-top: 15px;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 6px 18px;
      border-radius: 9999px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .cover-body {
      text-align: center;
      margin: 40px 0;
    }

    .cover-badge {
      display: inline-block;
      background-color: #10b981;
      color: white;
      font-size: 8.5pt;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 16px;
    }

    .cover-subtitle {
      font-size: 12pt;
      color: #334155;
      max-width: 650px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .cover-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      font-size: 10pt;
    }

    .cover-meta-item strong {
      display: block;
      color: #64748b;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .cover-meta-item span {
      font-weight: 600;
      color: #0f172a;
    }

    .cover-url-badge {
      grid-column: span 2;
      background-color: #f1f5f9;
      border-left: 4px solid #2563eb;
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5pt;
      color: #1e3a8a;
    }

    /* =========================================================================
       SECCIONES Y TIPOGRAFÍA
       ========================================================================= */
    .page-section {
      page-break-before: always;
      padding-top: 10px;
    }

    .page-section:first-of-type {
      page-break-before: avoid;
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      page-break-after: avoid;
    }

    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #1e3a8a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-top: 25px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e40af;
      margin-top: 20px;
      margin-bottom: 10px;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin-top: 15px;
      margin-bottom: 8px;
    }

    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 24px;
      margin-bottom: 14px;
    }

    li {
      margin-bottom: 5px;
    }

    /* =========================================================================
       TABLAS
       ========================================================================= */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 9px 12px;
      text-align: left;
    }

    th {
      background-color: #1e293b;
      color: white;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* =========================================================================
       BLOQUES DE CÓDIGO
       ========================================================================= */
    pre {
      background-color: #0f172a;
      color: #e2e8f0;
      padding: 12px 14px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 14px 0;
      page-break-inside: avoid;
      border: 1px solid #334155;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 9pt;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background: none;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* =========================================================================
       CAJAS DESTACADAS Y CITAS
       ========================================================================= */
    .callout {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
      page-break-inside: avoid;
    }

    .callout-title {
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 4px;
      font-size: 10pt;
    }

    .callout-success {
      background-color: #ecfdf5;
      border-left-color: #10b981;
    }
    .callout-success .callout-title { color: #047857; }

    .callout-warning {
      background-color: #fffbeb;
      border-left-color: #f59e0b;
    }
    .callout-warning .callout-title { color: #b45309; }

    .qa-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #3b82f6;
      border-radius: 6px;
      padding: 14px 18px;
      margin: 16px 0;
      page-break-inside: avoid;
    }

    .qa-question {
      font-weight: 700;
      color: #1e3a8a;
      font-size: 10.5pt;
      margin-bottom: 8px;
    }

    .qa-answer {
      color: #1e293b;
      font-size: 10pt;
      line-height: 1.55;
    }

    /* =========================================================================
       DIAGRAMAS VISUALES EN HTML/CSS
       ========================================================================= */
    .diagram-container {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 18px;
      margin: 18px 0;
      page-break-inside: avoid;
    }

    .diagram-title {
      font-weight: 700;
      color: #1e3a8a;
      text-align: center;
      font-size: 10.5pt;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .arch-flow {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .arch-tier {
      background-color: white;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
    }

    .arch-tier-title {
      font-weight: 700;
      font-size: 9pt;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }

    .arch-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }

    .arch-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 8.5pt;
    }

    .arch-card strong {
      display: block;
      color: #0f172a;
      font-size: 9pt;
      margin-bottom: 2px;
    }

    .arch-card span {
      color: #64748b;
      font-size: 8pt;
    }

    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }

    .checkbox {
      min-width: 16px;
      height: 16px;
      border: 2px solid #2563eb;
      border-radius: 3px;
      margin-top: 3px;
    }

    /* Print media adjustments */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .cover {
        min-height: 96vh;
      }
    }
  </style>
</head>
<body>

  <!-- =======================================================================
       PORTADA
       ======================================================================= -->
  <div class="cover">
    <div class="cover-header">
      <div class="cover-institution">Universidad Mariano Gálvez de Guatemala</div>
      <div class="cover-faculty">Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación</div>
      <div class="cover-course">SISTEMAS OPERATIVOS 1</div>
    </div>

    <div class="cover-body">
      <div class="cover-badge">Documento de Defensa Técnica</div>
      <h1 class="cover-title">PLATAFORMA WEB DE SIMULACIÓN DE SISTEMAS OPERATIVOS Y WIKI TRANSACCIONAL</h1>
      <p class="cover-subtitle">
        Investigación, modelado y ejecución de concurrencia nativa, detección de interbloqueos (Deadlock con RAG/DFS), asignación dinámica de memoria (First/Best/Worst Fit) y arquitectura cloud en Microsoft Azure con Nginx, PM2 y SSL.
      </p>
    </div>

    <div class="cover-footer">
      <div class="cover-meta-item">
        <strong>Estudiante / Autor</strong>
        <span>Manuel Felipe</span>
      </div>
      <div class="cover-meta-item">
        <strong>Fecha de Presentación</strong>
        <span>Octubre 2026</span>
      </div>
      <div class="cover-meta-item">
        <strong>Entorno de Servidor</strong>
        <span>Ubuntu Linux LTS (Azure Cloud VM)</span>
      </div>
      <div class="cover-meta-item">
        <strong>Arquitectura</strong>
        <span>Microservicios Híbridos (Next.js 16 + Python 3)</span>
      </div>
      <div class="cover-url-badge">
        <strong>Acceso en Producción:</strong> https://mfelipe.tech | https://mfelipe.tech/wiki
      </div>
    </div>
  </div>

  <!-- =======================================================================
       SECCIÓN 1: FICHA TÉCNICA
       ======================================================================= -->
  <div class="page-section">
    <h1>1. Ficha Técnica y Resumen Ejecutivo</h1>
    <p>
      El presente proyecto consiste en un entorno integral de experimentación y aprendizaje interactivo para la cátedra de <strong>Sistemas Operativos 1</strong>. Aborda experimentalmente los dos problemas centrales de la gestión de recursos en computadoras modernas: <strong>la sincronización en procesos concurrentes</strong> (concurrencia, condiciones de carrera y exclusión mutua) y <strong>la administración de la memoria principal</strong> (fragmentación y políticas de asignación).
    </p>

    <table>
      <thead>
        <tr>
          <th>Componente</th>
          <th>Tecnología / Versión</th>
          <th>Rol en el Sistema</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend Web</strong></td>
          <td>Next.js 16.3.3 / React 19.2.8</td>
          <td>Interfaz de usuario reactiva, dashboards en tiempo real y SSR.</td>
        </tr>
        <tr>
          <td><strong>Estilos & UI</strong></td>
          <td>Tailwind CSS v4 + Lucide Icons</td>
          <td>Diseño modular, modo oscuro/claro y adaptabilidad responsiva.</td>
        </tr>
        <tr>
          <td><strong>Motor de Concurrencia</strong></td>
          <td>Python 3 (Biblioteca Estándar)</td>
          <td>Hilos reales del SO (TID), monitores, candados y análisis de grafos.</td>
        </tr>
        <tr>
          <td><strong>Servidor HTTP Python</strong></td>
          <td>ThreadingHTTPServer</td>
          <td>Servidor REST multi-hilo con 0 dependencias externas (< 25 MB RAM).</td>
        </tr>
        <tr>
          <td><strong>Simulador de Memoria</strong></td>
          <td>TypeScript 5 (Motor de Simulación)</td>
          <td>Modelado de First Fit, Best Fit, Worst Fit y compactación contigua.</td>
        </tr>
        <tr>
          <td><strong>Base de Datos</strong></td>
          <td>MongoDB Atlas (Cloud Cluster)</td>
          <td>Base de datos NoSQL distribuida para persistencia de la Wiki.</td>
        </tr>
        <tr>
          <td><strong>ODM / Conectividad</strong></td>
          <td>Mongoose 9.9.4</td>
          <td>Pool de conexiones con patrón Singleton para evitar saturación.</td>
        </tr>
        <tr>
          <td><strong>Servidor / Cloud</strong></td>
          <td>Microsoft Azure Virtual Machine</td>
          <td>Instancia Ubuntu Linux con memoria Swap de 2 GB.</td>
        </tr>
        <tr>
          <td><strong>Proxy Inverso</strong></td>
          <td>Nginx Web Server</td>
          <td>Enrutamiento de <code>/</code> (presentación) y <code>/wiki</code> (Next.js).</td>
        </tr>
        <tr>
          <td><strong>Certificados SSL/TLS</strong></td>
          <td>Certbot / Let's Encrypt</td>
          <td>Cifrado HTTPS de extremo a extremo con renovación automática.</td>
        </tr>
        <tr>
          <td><strong>Gestor de Procesos</strong></td>
          <td>PM2 (Process Manager 2)</td>
          <td>Supervisión continua de servicios Node y Python tolerante a fallos.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- =======================================================================
       SECCIÓN 2: ARQUITECTURA
       ======================================================================= -->
  <div class="page-section">
    <h1>2. Arquitectura Global del Sistema</h1>
    <p>
      El sistema se diseñó bajo una <strong>Arquitectura Desacoplada en Tres Capas</strong>. Los servicios internos se aíslan estrictamente en el entorno local del servidor (<code>127.0.0.1</code>), garantizando que ningún servicio desprotegido quede expuesto a la red pública.
    </p>

    <div class="diagram-container">
      <div class="diagram-title">Diagrama de Arquitectura de Producción (mfelipe.tech)</div>
      <div class="arch-flow">
        <div class="arch-tier">
          <div class="arch-tier-title">1. Capa de Presentación Externa (Cliente / Internet)</div>
          <div class="arch-cards">
            <div class="arch-card">
              <strong>Navegador Web del Usuario</strong>
              <span>Conexión segura HTTPS / TLS 1.3 (Puerto 443)</span>
            </div>
            <div class="arch-card">
              <strong>Dominio Público Tech Domains</strong>
              <span>Registro DNS Tipo A hacia IP pública de Azure</span>
            </div>
          </div>
        </div>

        <div class="arch-tier">
          <div class="arch-tier-title">2. Capa Perimetral y Proxy Inverso (Nginx en Azure VM)</div>
          <div class="arch-cards">
            <div class="arch-card">
              <strong>Ruta Raíz: /</strong>
              <span>Sirve la página de presentación estática en /var/www/presentacion</span>
            </div>
            <div class="arch-card">
              <strong>Ruta Subdirectorio: /wiki</strong>
              <span>Proxy inverso transparente hacia Next.js en http://127.0.0.1:3000</span>
            </div>
            <div class="arch-card">
              <strong>Certbot (Let's Encrypt)</strong>
              <span>Cifrado SSL, redirección 301 de HTTP a HTTPS</span>
            </div>
          </div>
        </div>

        <div class="arch-tier">
          <div class="arch-tier-title">3. Capa de Aplicación y Servicios (Supervisados por PM2)</div>
          <div class="arch-cards">
            <div class="arch-card">
              <strong>Next.js 16 Frontend (:3000)</strong>
              <span>React 19, Simulación de Memoria, Proxy API interno</span>
            </div>
            <div class="arch-card">
              <strong>Python Concurrency Engine (:8000)</strong>
              <span>Threading nativo, RAG Graph, DFS Deadlock Detector</span>
            </div>
            <div class="arch-card">
              <strong>Swap Memory (2 GB SSD)</strong>
              <span>Prevención de caídas por Out-Of-Memory (OOM Killer)</span>
            </div>
          </div>
        </div>

        <div class="arch-tier">
          <div class="arch-tier-title">4. Capa de Persistencia Cloud</div>
          <div class="arch-cards">
            <div class="arch-card">
              <strong>MongoDB Atlas Cloud</strong>
              <span>Clúster distribuido NoSQL con diagnóstico de latencia en ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- =======================================================================
       SECCIÓN 3: MOTOR DE CONCURRENCIA EN PYTHON
       ======================================================================= -->
  <div class="page-section">
    <h1>3. Motor de Concurrencia y Transacciones (Python Engine)</h1>
    <p>
      El núcleo de concurrencia está implementado en <code>python_engine/engine.py</code>. Modela un sistema bancario transaccional con tres cuentas ($A, B, C$) sujetas a transacciones concurrentes.
    </p>

    <h2>3.1. Hilos Nativos del Sistema Operativo</h2>
    <p>
      A diferencia de entornos que utilizan temporizadores o promesas asíncronas de un solo hilo, este motor genera hilos nativos reales a través de <code>threading.Thread</code>. Cada hilo cuenta con su identificador nativo asignado por el kernel:
    </p>
    <pre><code># Captura del identificador nativo del kernel (Linux/Windows)
native_tid = threading.get_native_id()
process_pid = os.getpid()</code></pre>

    <h2>3.2. Invariante Transaccional de Consistencia</h2>
    <p>
      Para auditar matemáticamente la consistencia del sistema se estableció el siguiente principio de conservación de saldo:
    </p>
    <div class="callout callout-success">
      <div class="callout-title">Invariante de Integridad Contable:</div>
      <strong>Saldo(A) + Saldo(B) + Saldo(C) = 3000</strong><br>
      Cualquier desviación de este total ($\sum \neq 3000$) denota inequívocamente una condición de carrera con pérdida de datos o lecturas sucias.
    </div>

    <h2>3.3. Detección de Deadlocks y las 4 Condiciones de Coffman</h2>
    <p>
      El escenario de interbloqueo replica con precisión las cuatro condiciones formalizadas por Coffman (1971):
    </p>
    <ol>
      <li><strong>Exclusión Mutua:</strong> Cada cuenta cuenta con un cerrojo exclusivo (<code>threading.Lock</code>).</li>
      <li><strong>Retención y Espera:</strong> La transacción $T_1$ adquiere el Lock $A$ y, reteniéndolo, solicita el Lock $B$.</li>
      <li><strong>No Apropiación:</strong> El sistema operativo no confisca locks por la fuerza.</li>
      <li><strong>Espera Circular:</strong> $T_2$ retiene el Lock $B$ y solicita el Lock $A$, formando la cadena cerrada:
        <code>T1 &rarr; Lock B &rarr; T2 &rarr; Lock A &rarr; T1</code>.
      </li>
    </ol>

    <h2>3.4. Detección Formal con Búsqueda en Profundidad (DFS en RAG)</h2>
    <p>
      El motor modela un <strong>Grafo de Asignación de Recursos (RAG)</strong> bipartito. Sobre este grafo ejecuta un algoritmo <strong>DFS</strong> con coloreado de nodos:
    </p>
    <ul>
      <li><strong>Blanco (0):</strong> Nodo aún no explorado.</li>
      <li><strong>Gris (1):</strong> Nodo actualmente en la pila de recursión del DFS.</li>
      <li><strong>Negro (2):</strong> Nodo totalmente evaluado con sus descendientes.</li>
    </ul>
    <p>
      Si durante la búsqueda se detecta una arista hacia un nodo que ya está marcado como <strong>Gris</strong>, se confirma formalmente un ciclo cerrado de espera (Deadlock).
    </p>

    <h2>3.5. Cancelación Cooperativa de Víctima</h2>
    <p>
      Para resolver el interbloqueo sin corromper el sistema con llamadas forzosas (evitando <code>kill</code>), el motor utiliza <strong>cancelación cooperativa</strong>:
    </p>
    <div class="callout">
      <div class="callout-title">Protocolo de Recuperación:</div>
      El guardián selecciona a $T_2$ como víctima y activa su bandera <code>cancel_flags[T2] = True</code>. El hilo $T_2$ detecta la señal, aborta de forma ordenada y en su cláusula <code>finally</code> libera todos los cerrojos adquiridos. Esto rompe la espera circular y permite que $T_1$ termine exitosamente.
    </div>

    <h2>3.6. Condición de Carrera con Barreras de Sincronización</h2>
    <p>
      Para demostrar empíricamente el fallo por falta de sincronización, se utiliza <code>threading.Barrier(2)</code>. Ambos hilos leen el saldo de la cuenta $A$, se sincronizan en la barrera para escribir al mismo nanosegundo sin protección de candado, provocando una <strong>escritura perdida (Lost Update)</strong> y rompiendo el invariante de los 3000.
    </p>
  </div>

  <!-- =======================================================================
       SECCIÓN 4: SIMULADOR DE MEMORIA
       ======================================================================= -->
  <div class="page-section">
    <h1>4. Simulador de Gestión y Asignación de Memoria RAM</h1>
    <p>
      Ubicado en <code>src/lib/memorySimulator.ts</code> y visualizado en la ruta <code>/wiki/memory-simulator</code>, este módulo implementa y compara las estrategias clásicas de administración contigua de memoria:
    </p>

    <table>
      <thead>
        <tr>
          <th>Estrategia</th>
          <th>Criterio de Búsqueda</th>
          <th>Ventajas y Desventajas Teóricas</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>First Fit</strong><br>(Primer Ajuste)</td>
          <td>Asigna el primer bloque libre con tamaño &ge; al requerido por el proceso.</td>
          <td><strong>Ventaja:</strong> Es el más rápido en tiempo de CPU ($O(N)$ acotado).<br><strong>Desventaja:</strong> Tiende a acumular procesos al inicio de la memoria.</td>
        </tr>
        <tr>
          <td><strong>Best Fit</strong><br>(Mejor Ajuste)</td>
          <td>Examina toda la memoria y elige el hueco libre que deje el menor espacio sobrante.</td>
          <td><strong>Ventaja:</strong> Optimiza el tamaño del bloque asignado.<br><strong>Desventaja:</strong> Crea huecos diminutos inutilizables (alta fragmentación externa).</td>
        </tr>
        <tr>
          <td><strong>Worst Fit</strong><br>(Peor Ajuste)</td>
          <td>Examina toda la memoria y asigna el hueco libre de mayor tamaño disponible.</td>
          <td><strong>Ventaja:</strong> Deja un bloque sobrante grande que puede servir para otro proceso.<br><strong>Desventaja:</strong> Degrada bloques grandes rápidamente.</td>
        </tr>
      </tbody>
    </table>

    <h2>Compactación de Memoria</h2>
    <p>
      El simulador permite ejecutar en tiempo real una rutina de <strong>Compactación</strong>, la cual reubica todos los procesos en memoria continua hacia las direcciones bajas, unificando todos los fragmentos libres dispersos en un único gran bloque utilizable.
    </p>
  </div>

  <!-- =======================================================================
       SECCIÓN 5: DESPLIEGUE EN LA NUBE Y SEGURIDAD
       ======================================================================= -->
  <div class="page-section">
    <h1>5. Infraestructura Cloud, Despliegue y Seguridad (Azure)</h1>
    <p>
      El proyecto fue desplegado en una Máquina Virtual con <strong>Ubuntu Linux</strong> en Microsoft Azure, optimizada para estabilidad y alta disponibilidad:
    </p>

    <h2>5.1. Memoria Swap (2 GB) contra el OOM Killer</h2>
    <p>
      En servidores de nube con 1 GB o 2 GB de RAM, la compilación de aplicaciones con Next.js (<code>next build</code>) suele sobrepasar el límite físico de memoria, lo que activa el <em>Out-of-Memory (OOM) Killer</em> del kernel de Linux y cancela los procesos.
    </p>
    <div class="callout callout-warning">
      <div class="callout-title">Optimización Realizada:</div>
      Se configuró un archivo de intercambio Swap de <strong>2 GB</strong> en disco SSD con <code>vm.swappiness = 10</code>. Esto garantiza que el servidor absorba los picos de consumo de memoria sin degradar el rendimiento ni cerrar la conexión SSH.
    </div>

    <h2>5.2. Enrutamiento con Nginx Reverse Proxy</h2>
    <p>
      Nginx maneja todas las solicitudes entrantes en los puertos 80 y 443, distribuyéndolas según la ruta solicitada:
    </p>
    <pre><code>server {
    server_name mfelipe.tech www.mfelipe.tech;

    # Portada estática
    location / {
        root /var/www/presentacion;
        index index.html;
    }

    # Wiki interactiva Next.js
    location /wiki {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}</code></pre>

    <h2>5.3. Certificados SSL/TLS con Let's Encrypt</h2>
    <p>
      Se utilizó <code>certbot --nginx</code> para emitir certificados de clave pública X.509 validados mediante desafío ACME. Todo el tráfico no cifrado en HTTP es redirigido automáticamente con código <code>301 Moved Permanently</code> a la versión HTTPS con candado seguro.
    </p>

    <h2>5.4. Orquestación con PM2</h2>
    <p>
      Los servicios <code>python-engine</code> y <code>nextjs-frontend</code> corren bajo supervisión de <strong>PM2</strong>, con autoarranque configurado en <code>systemd</code>. Si cualquiera de los dos servicios arroja una excepción no controlada, PM2 lo reinicia en cuestión de milisegundos.
    </p>
  </div>

  <!-- =======================================================================
       SECCIÓN 6: GUÍA DE DEFENSA (PREGUNTAS Y RESPUESTAS)
       ======================================================================= -->
  <div class="page-section">
    <h1>6. Banco de Preguntas y Respuestas para la Defensa</h1>
    <p>
      Respuestas técnicas estructuradas para responder con autoridad y solvencia ante el jurado examinador:
    </p>

    <div class="qa-box">
      <div class="qa-question">P1: ¿Por qué construyeron el motor de concurrencia en Python en lugar de usar Node.js?</div>
      <div class="qa-answer">
        <strong>R:</strong> Node.js opera sobre un modelo asíncrono basado en un único hilo principal (Event Loop), por lo que simula concurrencia pero no ejecuta paralelismo real de hilos sobre el mismo espacio de memoria. En Sistemas Operativos 1 necesitábamos hilos reales del sistema operativo (<code>threading.Thread</code>) que compitieran por recursos de memoria y fueran planificados por el kernel, permitiendo capturar sus TIDs nativos, experimentar bloqueos genuinos y provocar condiciones de carrera reproducibles.
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P2: ¿Cómo demuestran computacionalmente que ocurrió un Deadlock?</div>
      <div class="qa-answer">
        <strong>R:</strong> Mediante teoría de grafos. Construimos un Grafo de Asignación de Recursos (RAG) donde los nodos son procesos y recursos, y las aristas representan posesión o espera. Ejecutamos un algoritmo de búsqueda en profundidad (DFS) con coloreado de nodos (blanco, gris y negro). Si encontramos una arista hacia un nodo gris (que está activo en la pila de recursión), se confirma la existencia de un ciclo cerrado. Al haber una sola instancia de cada recurso, un ciclo en el RAG equivale matemáticamente a un Deadlock.
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P3: ¿Por qué usaron cancelación cooperativa y no terminaron el proceso con kill forzoso?</div>
      <div class="qa-answer">
        <strong>R:</strong> En sistemas operativos en producción, terminar un proceso con una señal forzosa como <code>kill -9</code> deja recursos en estado inconsistente y locks huérfanos (candados retenidos que nadie podrá liberar). La cancelación cooperativa notifica a la víctima ($T_2$), la cual ejecuta su rutina de limpieza dentro de una cláusula <code>finally</code>, liberando limpiamente todos los locks y permitiendo que las demás transacciones continúen con normalidad.
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P4: ¿Por qué la suma de cuentas A + B + C = 3000 es la prueba clave?</div>
      <div class="qa-answer">
        <strong>R:</strong> Porque representa el principio de consistencia del modelo ACID. Al simular la condición de carrera con <code>threading.Barrier(2)</code>, dos hilos leen el mismo saldo y escriben sin exclusión mutua, produciendo una <em>escritura perdida</em>. El saldo total deja de ser 3000, lo que demuestra empíricamente el daño a la integridad de los datos cuando no se respetan las secciones críticas.
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-question">P5: ¿Qué rol cumple la memoria Swap de 2 GB en el servidor de Azure?</div>
      <div class="qa-answer">
        <strong>R:</strong> Protege la máquina virtual de caídas por agotamiento de RAM. Durante la compilación de paquetes o ante picos de concurrencia, la memoria RAM física puede saturarse. Sin Swap, el <em>OOM Killer</em> del kernel de Linux liquidaría procesos críticos como Node.js o el servicio SSH. El Swap proporciona un amortiguador en disco para garantizar 100% de disponibilidad.
      </div>
    </div>
  </div>

  <!-- =======================================================================
       SECCIÓN 7: CHECKLIST DE PRESENTACIÓN
       ======================================================================= -->
  <div class="page-section">
    <h1>7. Checklist de Verificación para la Presentación</h1>
    <p>Pasos de verificación recomendados antes de iniciar la exposición en vivo:</p>

    <div class="checklist-item">
      <div class="checkbox"></div>
      <div><strong>Verificar HTTPS en Producción:</strong> Cargar <code>https://mfelipe.tech</code> en el navegador y constatar que el certificado SSL figure como válido.</div>
    </div>

    <div class="checklist-item">
      <div class="checkbox"></div>
      <div><strong>Comprobar Estado de MongoDB:</strong> Ingresar a <code>https://mfelipe.tech/wiki</code> y verificar el indicador verde con la latencia en milisegundos hacia el clúster Atlas.</div>
    </div>

    <div class="checklist-item">
      <div class="checkbox"></div>
      <div><strong>Demostración de Deadlock:</strong> En <code>/wiki/concurrency</code>, activar el <em>Modo Paso a Paso</em>, avanzar hasta ver el ciclo rojo en el RAG y presionar "Resolver Deadlock" para mostrar la liberación de $T_2$.</div>
    </div>

    <div class="checklist-item">
      <div class="checkbox"></div>
      <div><strong>Demostración de Memoria:</strong> En <code>/wiki/memory-simulator</code>, crear 3 procesos, comparar el nivel de fragmentación entre <em>First Fit</em> y <em>Best Fit</em>, y ejecutar la compactación de bloques.</div>
    </div>

    <div class="checklist-item">
      <div class="checkbox"></div>
      <div><strong>Terminal SSH Lista:</strong> Tener abierta la consola del servidor con <code>pm2 status</code> para demostrar que ambos servicios corren en segundo plano con reinicio automático.</div>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    # Rutas
    base_dir = os.path.abspath(r"c:\Users\manol\projects\wiki\docs")
    html_path = os.path.join(base_dir, "DEFENSA_PROYECTO.html")
    pdf_path = os.path.join(base_dir, "DEFENSA_PROYECTO.pdf")
    
    # 1. Guardar archivo HTML
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print(f"HTML generado exitosamente en: {html_path}")

    # 2. Localizar Microsoft Edge
    edge_executable = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_executable):
        edge_executable = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    if not os.path.exists(edge_executable):
        print("Error: No se encontró el ejecutable de Microsoft Edge.")
        return False

    # 3. Ejecutar Edge Headless para imprimir a PDF
    cmd = [
        edge_executable,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]

    print("Ejecutando Microsoft Edge Headless para renderizar PDF...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"PDF generado con éxito: {pdf_path} ({size_kb:.1f} KB)")
        return True
    else:
        print(f"Error generando el PDF. Código de salida: {result.returncode}")
        print("Stderr:", result.stderr)
        return False

if __name__ == "__main__":
    generate_pdf()
