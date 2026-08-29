export type ProcessStatus = "WAITING" | "RUNNING" | "COMPLETED" | "TERMINATED";
export type AllocationAlgorithm = "FIRST_FIT" | "BEST_FIT" | "WORST_FIT";

export interface SimProcess {
  pid: number;
  name: string;
  requiredMemory: number;
  duration: number;
  remainingTime: number;
  status: ProcessStatus;
  color: string;
  memoryStartAddress?: number;
  memoryEndAddress?: number;
  createdAtTick: number;
  startedAtTick?: number;
  finishedAtTick?: number;
}

export interface MemoryBlock {
  start: number;
  end: number;
  size: number;
  isFree: boolean;
  process?: SimProcess;
}

export interface SimLog {
  id: string;
  tick: number;
  type:
    | "INFO"
    | "PROCESS_CREATED"
    | "PROCESS_ADMITTED"
    | "PROCESS_QUEUED"
    | "PROCESS_FINISHED"
    | "PROCESS_TERMINATED"
    | "MEMORY_FREED";
  message: string;
  time: string;
}

export interface SimulationState {
  totalMemory: number; // in MB, default 1024
  currentTick: number;
  algorithm: AllocationAlgorithm;
  speedMs: number;
  processes: SimProcess[];
  logs: SimLog[];
  nextPid: number;
}

export const PROCESS_PALETTE = [
  "#3B82F6", // Azul
  "#10B981", // Esmeralda
  "#F59E0B", // Ámbar
  "#EC4899", // Rosa
  "#8B5CF6", // Púrpura
  "#06B6D4", // Cian
  "#F97316", // Naranja
  "#14B8A6", // Turquesa
  "#6366F1", // Índigo
  "#EF4444", // Rojo
  "#84CC16", // Lima
  "#D946EF", // Fucsia
];

export const SYSTEM_PROCESS_NAMES = [
  "WebBrowser",
  "DB_Server",
  "Compiler",
  "AudioPlayer",
  "VideoEncoder",
  "TextEditor",
  "GameEngine",
  "AnalyticsWorker",
  "ImageProcessor",
  "NetworkDaemon",
  "SecurityScanner",
  "CloudSync",
  "DataBackup",
  "RenderPipeline",
  "APIGateway",
];

export function getRandomColor(): string {
  return PROCESS_PALETTE[Math.floor(Math.random() * PROCESS_PALETTE.length)];
}

export function getRandomProcessName(): string {
  return SYSTEM_PROCESS_NAMES[Math.floor(Math.random() * SYSTEM_PROCESS_NAMES.length)];
}

/**
 * Calcula la disposición de memoria continua (0 a totalMemory MB)
 */
export function getMemoryLayout(
  runningProcesses: SimProcess[],
  totalMemory: number = 1024
): MemoryBlock[] {
  const sorted = [...runningProcesses]
    .filter((p) => p.memoryStartAddress !== undefined && p.memoryEndAddress !== undefined)
    .sort((a, b) => (a.memoryStartAddress ?? 0) - (b.memoryStartAddress ?? 0));

  const blocks: MemoryBlock[] = [];
  let currentAddr = 0;

  for (const proc of sorted) {
    const start = proc.memoryStartAddress!;
    const end = proc.memoryEndAddress!;

    if (start > currentAddr) {
      blocks.push({
        start: currentAddr,
        end: start,
        size: start - currentAddr,
        isFree: true,
      });
    }

    blocks.push({
      start,
      end,
      size: end - start,
      isFree: false,
      process: proc,
    });

    currentAddr = end;
  }

  if (currentAddr < totalMemory) {
    blocks.push({
      start: currentAddr,
      end: totalMemory,
      size: totalMemory - currentAddr,
      isFree: true,
    });
  }

  return blocks;
}

/**
 * Algoritmo de asignación de memoria: FIRST_FIT, BEST_FIT, WORST_FIT
 */
export function allocateMemory(
  requiredMb: number,
  runningProcesses: SimProcess[],
  algorithm: AllocationAlgorithm,
  totalMemory: number = 1024
): { allocated: boolean; start?: number; end?: number } {
  if (requiredMb <= 0 || requiredMb > totalMemory) {
    return { allocated: false };
  }

  const layout = getMemoryLayout(runningProcesses, totalMemory);
  const freeBlocks = layout.filter((b) => b.isFree && b.size >= requiredMb);

  if (freeBlocks.length === 0) {
    return { allocated: false };
  }

  let selectedBlock: MemoryBlock;

  if (algorithm === "BEST_FIT") {
    // Bloque más pequeño que alcance
    selectedBlock = freeBlocks.reduce((prev, curr) => (curr.size < prev.size ? curr : prev));
  } else if (algorithm === "WORST_FIT") {
    // Bloque más grande disponible
    selectedBlock = freeBlocks.reduce((prev, curr) => (curr.size > prev.size ? curr : prev));
  } else {
    // FIRST_FIT: Primer bloque adecuado
    selectedBlock = freeBlocks[0];
  }

  const start = selectedBlock.start;
  const end = start + requiredMb;

  return { allocated: true, start, end };
}

/**
 * Calcula estadísticas de memoria RAM
 */
export function getMemoryStats(runningProcesses: SimProcess[], totalMemory: number = 1024) {
  const layout = getMemoryLayout(runningProcesses, totalMemory);
  const usedMb = layout.filter((b) => !b.isFree).reduce((acc, b) => acc + b.size, 0);
  const freeMb = totalMemory - usedMb;
  const usedPercent = Math.round((usedMb / totalMemory) * 100);
  const freePercent = 100 - usedPercent;

  const freeBlocks = layout.filter((b) => b.isFree);
  const maxContiguousFree = freeBlocks.length > 0 ? Math.max(...freeBlocks.map((b) => b.size)) : 0;
  const fragmentationCount = freeBlocks.length;

  return {
    totalMb: totalMemory,
    usedMb,
    freeMb,
    usedPercent,
    freePercent,
    maxContiguousFree,
    fragmentationCount,
    blocks: layout,
  };
}

/**
 * Estado inicial de la simulación
 */
export function createInitialSimulationState(
  totalMemory = 1024,
  algorithm: AllocationAlgorithm = "FIRST_FIT"
): SimulationState {
  return {
    totalMemory,
    currentTick: 0,
    algorithm,
    speedMs: 1000,
    processes: [],
    logs: [
      {
        id: "log-init",
        tick: 0,
        type: "INFO",
        message: `Simulador iniciado. RAM: ${totalMemory} MB. Algoritmo: ${algorithm}.`,
        time: new Date().toLocaleTimeString(),
      },
    ],
    nextPid: 1001,
  };
}

/**
 * Crea un proceso y lo admite en RAM o lo envía a la cola de espera
 */
export function addProcessToState(
  state: SimulationState,
  params: {
    name?: string;
    pid?: number;
    requiredMemory: number;
    duration: number;
  }
): SimulationState {
  const pid = params.pid && !state.processes.some((p) => p.pid === params.pid)
    ? params.pid
    : state.nextPid;

  const rawName = params.name && params.name.trim() ? params.name.trim() : getRandomProcessName();
  const name = `${rawName}_${pid}`;
  const requiredMemory = Math.max(16, Math.min(state.totalMemory, params.requiredMemory));
  const duration = Math.max(1, params.duration);

  const runningProcs = state.processes.filter((p) => p.status === "RUNNING");
  const alloc = allocateMemory(requiredMemory, runningProcs, state.algorithm, state.totalMemory);

  const newLogs = [...state.logs];

  const newProcess: SimProcess = {
    pid,
    name,
    requiredMemory,
    duration,
    remainingTime: duration,
    status: alloc.allocated ? "RUNNING" : "WAITING",
    color: getRandomColor(),
    memoryStartAddress: alloc.start,
    memoryEndAddress: alloc.end,
    createdAtTick: state.currentTick,
    startedAtTick: alloc.allocated ? state.currentTick : undefined,
  };

  if (alloc.allocated) {
    newLogs.unshift({
      id: `log-${Date.now()}-${pid}`,
      tick: state.currentTick,
      type: "PROCESS_ADMITTED",
      message: `PID ${pid} ('${name}') asignado a RAM: [${alloc.start} MB - ${alloc.end} MB] (${requiredMemory} MB, ${duration}s).`,
      time: new Date().toLocaleTimeString(),
    });
  } else {
    newLogs.unshift({
      id: `log-${Date.now()}-${pid}`,
      tick: state.currentTick,
      type: "PROCESS_QUEUED",
      message: `PID ${pid} ('${name}') en COLA DE ESPERA. Requiere ${requiredMemory} MB continuo.`,
      time: new Date().toLocaleTimeString(),
    });
  }

  return {
    ...state,
    nextPid: pid >= state.nextPid ? pid + 1 : state.nextPid,
    processes: [...state.processes, newProcess],
    logs: newLogs.slice(0, 100),
  };
}

/**
 * Ejecuta un tick del reloj:
 * - Reduce remainingTime de los procesos en ejecución
 * - Libera los que finalizan
 * - Asigna memoria a los procesos en espera si caben
 */
export function advanceSimulationTick(state: SimulationState): SimulationState {
  const nextTick = state.currentTick + 1;
  const newLogs = [...state.logs];

  // 1. Actualizar procesos en ejecución
  const updatedProcs = state.processes.map((proc) => {
    if (proc.status === "RUNNING") {
      const nextRemaining = proc.remainingTime - 1;
      if (nextRemaining <= 0) {
        newLogs.unshift({
          id: `log-${Date.now()}-${proc.pid}-fin`,
          tick: nextTick,
          type: "PROCESS_FINISHED",
          message: `PID ${proc.pid} ('${proc.name}') finalizó ejecución. Liberando [${proc.memoryStartAddress} MB - ${proc.memoryEndAddress} MB].`,
          time: new Date().toLocaleTimeString(),
        });

        return {
          ...proc,
          remainingTime: 0,
          status: "COMPLETED" as ProcessStatus,
          finishedAtTick: nextTick,
          memoryStartAddress: undefined,
          memoryEndAddress: undefined,
        };
      }
      return {
        ...proc,
        remainingTime: nextRemaining,
      };
    }
    return proc;
  });

  // 2. Procesar cola de espera (FIFO)
  let currentRunning = updatedProcs.filter((p) => p.status === "RUNNING");

  const finalProcs = updatedProcs.map((proc) => {
    if (proc.status === "WAITING") {
      const alloc = allocateMemory(
        proc.requiredMemory,
        currentRunning,
        state.algorithm,
        state.totalMemory
      );

      if (alloc.allocated) {
        newLogs.unshift({
          id: `log-${Date.now()}-${proc.pid}-promo`,
          tick: nextTick,
          type: "PROCESS_ADMITTED",
          message: `PID ${proc.pid} ('${proc.name}') promovido de la COLA a RAM: [${alloc.start} MB - ${alloc.end} MB].`,
          time: new Date().toLocaleTimeString(),
        });

        const promoted: SimProcess = {
          ...proc,
          status: "RUNNING",
          memoryStartAddress: alloc.start,
          memoryEndAddress: alloc.end,
          startedAtTick: nextTick,
        };
        currentRunning = [...currentRunning, promoted];
        return promoted;
      }
    }
    return proc;
  });

  return {
    ...state,
    currentTick: nextTick,
    processes: finalProcs,
    logs: newLogs.slice(0, 100),
  };
}

/**
 * Termina forzosamente un proceso por su PID
 */
export function terminateProcessInState(state: SimulationState, pid: number): SimulationState {
  const newLogs = [...state.logs];

  const updatedProcs = state.processes.map((proc) => {
    if (proc.pid === pid && (proc.status === "RUNNING" || proc.status === "WAITING")) {
      newLogs.unshift({
        id: `log-${Date.now()}-${pid}-term`,
        tick: state.currentTick,
        type: "PROCESS_TERMINATED",
        message: `PID ${pid} ('${proc.name}') fue TERMINADO manualmente por el usuario.`,
        time: new Date().toLocaleTimeString(),
      });

      return {
        ...proc,
        status: "TERMINATED" as ProcessStatus,
        remainingTime: 0,
        finishedAtTick: state.currentTick,
        memoryStartAddress: undefined,
        memoryEndAddress: undefined,
      };
    }
    return proc;
  });

  // Re-evaluar cola de espera
  let currentRunning = updatedProcs.filter((p) => p.status === "RUNNING");

  const finalProcs = updatedProcs.map((proc) => {
    if (proc.status === "WAITING") {
      const alloc = allocateMemory(
        proc.requiredMemory,
        currentRunning,
        state.algorithm,
        state.totalMemory
      );

      if (alloc.allocated) {
        newLogs.unshift({
          id: `log-${Date.now()}-${proc.pid}-prom`,
          tick: state.currentTick,
          type: "PROCESS_ADMITTED",
          message: `PID ${proc.pid} ('${proc.name}') promovido de la COLA a RAM: [${alloc.start} MB - ${alloc.end} MB].`,
          time: new Date().toLocaleTimeString(),
        });

        const promoted: SimProcess = {
          ...proc,
          status: "RUNNING",
          memoryStartAddress: alloc.start,
          memoryEndAddress: alloc.end,
          startedAtTick: state.currentTick,
        };
        currentRunning = [...currentRunning, promoted];
        return promoted;
      }
    }
    return proc;
  });

  return {
    ...state,
    processes: finalProcs,
    logs: newLogs.slice(0, 100),
  };
}
