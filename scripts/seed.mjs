// Carga los temas iniciales de la Wiki en MongoDB.
// Uso:  node --env-file=.env scripts/seed.mjs
// Es seguro ejecutarlo varias veces: actualiza los temas existentes
// (mismo título y unidad) en lugar de duplicarlos.
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Falta MONGODB_URI. Ejecuta: node --env-file=.env scripts/seed.mjs");
  process.exit(1);
}

// Mismo esquema que src/models/Tema.ts
const Tema =
  mongoose.models.Tema ||
  mongoose.model(
    "Tema",
    new mongoose.Schema(
      {
        title: { type: String, required: true, trim: true, maxlength: 150 },
        unit: { type: Number, required: true, min: 1, max: 3 },
        content: { type: String, required: true, trim: true },
      },
      { timestamps: true }
    )
  );

const temas = [
  // ───────────── Unidad 1: Introducción a los sistemas operativos ─────────────
  {
    unit: 1,
    title: "¿Qué es un sistema operativo?",
    content: `Un sistema operativo (SO) es el software que administra el hardware de una computadora y ofrece servicios a los programas y a los usuarios.

Funciones principales:
• Administrar el procesador (qué proceso se ejecuta y cuándo).
• Administrar la memoria (asignarla y liberarla).
• Administrar los dispositivos de entrada y salida.
• Administrar archivos y almacenamiento.
• Proteger los recursos y los datos.

Actúa como intermediario: los programas no hablan directamente con el hardware, piden los recursos al SO.`,
  },
  {
    unit: 1,
    title: "Evolución de los sistemas operativos",
    content: `Etapas generales:
• Sin sistema operativo: el programador controlaba directamente la máquina.
• Procesamiento por lotes: los trabajos se agrupaban y se ejecutaban uno tras otro, sin interacción.
• Multiprogramación: varios programas en memoria; mientras uno espera entrada/salida, otro usa el procesador.
• Tiempo compartido: el procesador se reparte en turnos cortos y varios usuarios interactúan a la vez.
• Computadoras personales: SO de un solo usuario y con interfaz gráfica.
• Sistemas distribuidos y móviles: varios equipos cooperando, y dispositivos con recursos limitados.`,
  },
  {
    unit: 1,
    title: "Clasificación de los sistemas operativos",
    content: `Según el número de usuarios:
• Monousuario: un solo usuario a la vez.
• Multiusuario: varios usuarios simultáneos.

Según el número de tareas:
• Monotarea: ejecuta un programa a la vez.
• Multitarea: ejecuta varios programas a la vez.

Otras clasificaciones:
• Por lotes, de tiempo compartido y de tiempo real (responden dentro de un plazo garantizado).
• Distribuidos: varios equipos que se ven como un solo sistema.
• Por estructura: monolíticos, por capas y de micronúcleo.`,
  },
  {
    unit: 1,
    title: "Llamadas al sistema y protección",
    content: `Una llamada al sistema (system call) es la forma en que un programa de usuario pide un servicio al núcleo, por ejemplo: crear un proceso (fork), leer un archivo (read) o escribir en pantalla (write).

Modos de operación:
• Modo usuario: el código tiene privilegios limitados.
• Modo núcleo (kernel): acceso total al hardware.

Cuando un programa hace una llamada al sistema, el procesador pasa de modo usuario a modo núcleo, el SO atiende la petición y luego regresa a modo usuario.

Protección: el SO evita que un programa dañe a otro o acceda a recursos que no le corresponden (por ejemplo, con la protección de memoria y los modos de operación).`,
  },

  // ───────────── Unidad 2: Procesos e hilos ─────────────
  {
    unit: 2,
    title: "Procesos y bloque de control (PCB)",
    content: `Un proceso es un programa en ejecución. Tiene su propio espacio de memoria, su código, sus datos y sus recursos.

El SO guarda la información de cada proceso en una estructura llamada Bloque de Control de Proceso (PCB). Incluye:
• Identificador (PID) y PID del proceso padre.
• Estado del proceso.
• Contador de programa y registros del procesador.
• Información de memoria y de archivos abiertos.

Creación de procesos en Linux:
• fork() crea un proceso hijo copia del padre.
• exec() reemplaza el programa del proceso por otro.
• wait() permite al padre esperar a que termine el hijo.

Casos especiales: un proceso zombi ya terminó pero su padre aún no lo recogió con wait(); un proceso huérfano es aquel cuyo padre terminó antes que él.`,
  },
  {
    unit: 2,
    title: "Estados de los procesos",
    content: `Un proceso cambia de estado durante su vida:
• Nuevo: se está creando.
• Listo: tiene todo lo necesario y espera su turno en el procesador.
• Ejecución: está usando el procesador.
• Bloqueado (en espera): espera un evento, como una operación de entrada/salida.
• Terminado: finalizó su ejecución.

Transiciones típicas:
• Listo → Ejecución: el planificador lo elige.
• Ejecución → Listo: se le acabó su tiempo (quantum).
• Ejecución → Bloqueado: pide una operación de E/S.
• Bloqueado → Listo: el evento que esperaba ocurrió.
• Ejecución → Terminado: acaba o es eliminado.`,
  },
  {
    unit: 2,
    title: "Hilos y multiprocesamiento simétrico (SMP)",
    content: `Un hilo (thread) es una unidad de ejecución dentro de un proceso. Los hilos de un mismo proceso comparten código, datos y archivos abiertos, pero cada uno tiene su propia pila, registros y contador de programa.

Ventajas frente a usar varios procesos:
• Crearlos y cambiar entre ellos es más barato.
• Comparten memoria con facilidad.
• Permiten aprovechar varios núcleos del procesador.

Riesgo: como comparten datos, necesitan sincronización para evitar errores de acceso simultáneo.

SMP (multiprocesamiento simétrico): varios procesadores idénticos comparten la misma memoria y están controlados por un único SO, que reparte el trabajo entre ellos.`,
  },
  {
    unit: 2,
    title: "Micronúcleos y los sistemas Windows y Linux",
    content: `Un micronúcleo deja dentro del núcleo solo lo esencial: comunicación entre procesos, gestión básica de memoria y planificación. Los demás servicios (sistema de archivos, controladores) funcionan como procesos de usuario.
• Ventajas: más modular, seguro y fácil de ampliar.
• Desventaja: más comunicación entre componentes, lo que puede reducir el rendimiento.

Linux tiene un núcleo monolítico, pero modular: permite cargar y descargar módulos mientras el sistema funciona.

Windows usa una arquitectura híbrida: un núcleo con un diseño inspirado en el micronúcleo, pero con muchos servicios ejecutándose en modo núcleo por rendimiento.`,
  },

  // ───────────── Unidad 3: Concurrencia e interbloqueo ─────────────
  {
    unit: 3,
    title: "Concurrencia y condición de carrera",
    content: `Concurrencia: varios procesos o hilos avanzan durante el mismo período, y pueden competir por recursos compartidos.

Una condición de carrera ocurre cuando el resultado depende del orden en que se intercalan las operaciones de varios hilos sobre un dato compartido.

Ejemplo: dos hilos incrementan un contador. Cada uno lee el valor, suma 1 y lo escribe. Si ambos leen el mismo valor antes de escribir, uno de los incrementos se pierde.

Sección crítica: la parte del código que accede al recurso compartido y que debe ejecutarse por un solo hilo a la vez.`,
  },
  {
    unit: 3,
    title: "Exclusión mutua, mutex y semáforos",
    content: `Exclusión mutua: garantiza que solo un hilo esté dentro de la sección crítica en un momento dado.

Mutex (candado / lock): solo un hilo puede tomarlo. Quien lo toma entra a la sección crítica y lo libera al salir.

Semáforo: contador entero con dos operaciones atómicas:
• wait (P): si el valor es mayor que 0 lo disminuye; si es 0, el hilo espera.
• signal (V): aumenta el valor y despierta a un hilo en espera.

Tipos:
• Binario: valores 0 o 1, funciona como un mutex.
• Contador: controla el acceso a un conjunto de recursos iguales.

Se usan, por ejemplo, en el problema del productor y consumidor.`,
  },
  {
    unit: 3,
    title: "Monitores y paso de mensajes",
    content: `Monitor: estructura que agrupa datos compartidos y las operaciones que los usan. Solo un hilo puede ejecutar código del monitor a la vez. Incluye variables de condición con las operaciones wait (esperar liberando el monitor) y signal (avisar que la condición pudo cambiar).

Paso de mensajes: los procesos se comunican con las operaciones send (enviar) y receive (recibir), sin compartir memoria. Sirve también para sincronizarse, y funciona entre procesos de distintas máquinas.`,
  },
  {
    unit: 3,
    title: "Interbloqueo (deadlock) e inanición",
    content: `Interbloqueo: situación en la que varios procesos esperan indefinidamente recursos que otros del grupo retienen, y ninguno puede avanzar.

Las cuatro condiciones de Coffman (deben cumplirse todas):
• Exclusión mutua: un recurso solo puede usarlo un proceso a la vez.
• Retención y espera: un proceso conserva recursos mientras pide otros.
• Sin expropiación: nadie puede quitarle un recurso a quien lo tiene.
• Espera circular: existe un ciclo de procesos donde cada uno espera un recurso del siguiente.

Prevención: evitar al menos una condición, por ejemplo pidiendo los recursos siempre en el mismo orden.
Detección: se usa un grafo de asignación de recursos; un ciclo indica interbloqueo cuando cada recurso tiene una sola instancia.
Recuperación: terminar o cancelar uno de los procesos involucrados.

Inanición: un proceso espera indefinidamente aunque el sistema no esté bloqueado, porque otros siempre lo adelantan.`,
  },
];

async function main() {
  await mongoose.connect(uri);
  let creados = 0;
  let actualizados = 0;
  for (const t of temas) {
    const r = await Tema.updateOne(
      { title: t.title, unit: t.unit },
      { $set: { content: t.content } },
      { upsert: true }
    );
    if (r.upsertedCount) creados++;
    else actualizados++;
  }
  console.log(`✅ Seed listo: ${creados} creados, ${actualizados} actualizados (${temas.length} temas).`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("❌ Error en el seed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
