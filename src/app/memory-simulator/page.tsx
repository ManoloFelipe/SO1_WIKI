"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  SimProcess,
  AllocationAlgorithm,
  createInitialSimulationState,
  addProcessToState,
  advanceSimulationTick,
  terminateProcessInState,
  getMemoryStats,
  getRandomProcessName,
} from "@/lib/memorySimulator";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  PlusCircle,
  Dices,
  Clock,
  HardDrive,
  PlayCircle,
  ListOrdered,
  CheckCircle2,
  Trash2,
  Cpu,
  Layers,
  Info,
  Sliders,
  Sparkles,
} from "lucide-react";

export default function MemorySimulatorPage() {
  const [simState, setSimState] = useState(createInitialSimulationState());
  const [isRunning, setIsRunning] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<{
    start: number;
    end: number;
    size: number;
    isFree: boolean;
    process?: SimProcess;
  } | null>(null);

  // Formulario nuevo proceso
  const [procName, setProcName] = useState("");
  const [procPid, setProcPid] = useState("");
  const [procRam, setProcRam] = useState(128);
  const [procDuration, setProcDuration] = useState(10);

  // Pestaña activa en panel derecho
  const [activeTab, setActiveTab] = useState<"running" | "waiting" | "logs">("running");

  // Auto-tick simulation interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSimState((prev) => advanceSimulationTick(prev));
      }, simState.speedMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, simState.speedMs]);

  // Controles
  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleStepTick = () => {
    setSimState((prev) => advanceSimulationTick(prev));
  };

  const handleReset = () => {
    setIsRunning(false);
    setSimState(createInitialSimulationState(1024, simState.algorithm));
    setSelectedBlock(null);
  };

  const handleAlgorithmChange = (algo: AllocationAlgorithm) => {
    setSimState((prev) => ({
      ...prev,
      algorithm: algo,
      logs: [
        {
          id: `log-algo-${Date.now()}`,
          tick: prev.currentTick,
          type: "INFO",
          message: `Algoritmo de asignación cambiado a ${algo}.`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.logs,
      ],
    }));
  };

  const handleSpeedChange = (speed: number) => {
    setSimState((prev) => ({ ...prev, speedMs: speed }));
  };

  const handleCreateProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setSimState((prev) =>
      addProcessToState(prev, {
        name: procName.trim() || undefined,
        pid: procPid.trim() ? parseInt(procPid.trim(), 10) : undefined,
        requiredMemory: procRam,
        duration: procDuration,
      })
    );
    setProcName("");
    setProcPid("");
  };

  const handleGenerateRandomProcess = () => {
    const memoryPresets = [32, 64, 96, 128, 192, 256, 384, 512];
    const randomRam = memoryPresets[Math.floor(Math.random() * memoryPresets.length)];
    const randomDuration = Math.floor(Math.random() * 15) + 5; // 5s a 20s
    const randomName = getRandomProcessName();

    setSimState((prev) =>
      addProcessToState(prev, {
        name: randomName,
        requiredMemory: randomRam,
        duration: randomDuration,
      })
    );
  };

  const handleTerminateProcess = (pid: number) => {
    setSimState((prev) => terminateProcessInState(prev, pid));
    if (selectedBlock?.process?.pid === pid) {
      setSelectedBlock(null);
    }
  };

  // Métricas calculadas
  const runningProcesses = simState.processes.filter((p) => p.status === "RUNNING");
  const waitingProcesses = simState.processes.filter((p) => p.status === "WAITING");
  const completedProcesses = simState.processes.filter(
    (p) => p.status === "COMPLETED" || p.status === "TERMINATED"
  );
  const stats = getMemoryStats(runningProcesses, simState.totalMemory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Encabezado Principal de la Simulación */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Simulador de Procesos & Memoria RAM
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium">
                  {isRunning ? "Simulando" : "Pausado"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1 CPU Virtual • RAM Total: 1024 MB (1 GB) • Algoritmo:{" "}
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {simState.algorithm}
                </span>
              </p>
            </div>
          </div>

          {/* Barra de Controles Globales */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Reloj del SO */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-slate-500 dark:text-slate-400">Reloj:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-300 text-sm">
                T = {simState.currentTick}s
              </span>
            </div>

            {/* Botón Play / Pause */}
            <button
              onClick={handleTogglePlay}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-colors ${
                isRunning
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Iniciar
                </>
              )}
            </button>

            {/* Botón Paso (+1s) */}
            <button
              onClick={handleStepTick}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Avanzar 1 segundo"
            >
              <StepForward className="w-3.5 h-3.5 mr-1 text-cyan-500" />
              Paso (+1s)
            </button>

            {/* Botón Reset */}
            <button
              onClick={handleReset}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
              title="Reiniciar simulación"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </button>

            {/* Selectores de Algoritmo y Velocidad */}
            <select
              value={simState.algorithm}
              onChange={(e) => handleAlgorithmChange(e.target.value as AllocationAlgorithm)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="FIRST_FIT">First-Fit (Primer Bloque)</option>
              <option value="BEST_FIT">Best-Fit (Mejor Ajuste)</option>
              <option value="WORST_FIT">Worst-Fit (Peor Ajuste)</option>
            </select>

            <select
              value={simState.speedMs}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={2000}>0.5x (Lento 2s)</option>
              <option value={1000}>1.0x (Normal 1s)</option>
              <option value={500}>2.0x (Rápido 0.5s)</option>
            </select>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Métrica 1: RAM */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Uso de RAM
              </span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats.usedMb}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
                / {simState.totalMemory} MB
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300">
                {stats.usedPercent}%
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${stats.usedPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Libre: {stats.freeMb} MB</span>
              <span>Bloques libres: {stats.fragmentationCount}</span>
            </div>
          </div>

          {/* Métrica 2: En Ejecución */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                En Ejecución
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {runningProcesses.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                procesos en memoria
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Ejecución concurrente en tiempo real
            </p>
          </div>

          {/* Métrica 3: Cola de Espera */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cola de Espera
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ListOrdered className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {waitingProcesses.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                esperando por RAM
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-amber-500" />
              Despacho ordenado FIFO
            </p>
          </div>

          {/* Métrica 4: Finalizados */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Finalizados
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {completedProcesses.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                procesos terminados
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Trash2 className="w-3 h-3 text-indigo-500" />
              Memoria liberada y reutilizada
            </p>
          </div>
        </section>

        {/* Mapa Gráfico de Asignación de Memoria RAM (1024 MB) */}
        <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Mapa Gráfico de Memoria RAM (1024 MB)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 border border-dashed border-slate-400 dark:border-slate-600" />
                Libre
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500" />
                Asignado a Proceso
              </span>
            </div>
          </div>

          {/* Barra Segmentada de Memoria */}
          <div className="relative w-full">
            <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex overflow-hidden shadow-inner p-1 gap-1">
              {stats.blocks.map((block, idx) => {
                const widthPercent = (block.size / simState.totalMemory) * 100;

                if (block.isFree) {
                  return (
                    <div
                      key={`free-${block.start}-${idx}`}
                      onClick={() => setSelectedBlock(block)}
                      style={{ width: `${widthPercent}%` }}
                      className="h-full rounded-lg border border-dashed border-slate-300 dark:border-slate-800 hover:border-cyan-500/60 bg-slate-200/40 dark:bg-slate-900/40 transition-all cursor-pointer flex flex-col items-center justify-center p-1 overflow-hidden select-none group"
                      title={`Espacio Libre: ${block.size} MB [${block.start} - ${block.end} MB]`}
                    >
                      {widthPercent > 5 && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {block.size} MB
                        </span>
                      )}
                    </div>
                  );
                }

                const proc = block.process!;
                const progress =
                  proc.duration > 0
                    ? Math.round(((proc.duration - proc.remainingTime) / proc.duration) * 100)
                    : 100;

                return (
                  <div
                    key={`proc-${proc.pid}-${block.start}`}
                    onClick={() => setSelectedBlock(block)}
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: proc.color,
                    }}
                    className="h-full rounded-lg shadow-sm hover:brightness-110 transition-all cursor-pointer flex flex-col justify-between p-1.5 overflow-hidden text-white select-none relative group"
                    title={`PID ${proc.pid} (${proc.name}) - ${block.size} MB [${block.start} - ${block.end} MB]`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold truncate">
                        #{proc.pid}
                      </span>
                      {widthPercent > 7 && (
                        <span className="text-[9px] font-mono bg-black/30 px-1 rounded">
                          {proc.remainingTime}s
                        </span>
                      )}
                    </div>
                    {widthPercent > 9 && (
                      <span className="text-[10px] truncate font-medium drop-shadow-sm">
                        {proc.name}
                      </span>
                    )}
                    {/* Barra interna de progreso */}
                    <div className="w-full bg-black/20 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-white/80 h-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escala de Direcciones */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1.5 px-1 select-none">
              <span>0 MB</span>
              <span>256 MB</span>
              <span>512 MB</span>
              <span>768 MB</span>
              <span>1024 MB</span>
            </div>
          </div>

          {/* Inspector de Bloque Seleccionado */}
          <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs flex flex-wrap items-center justify-between gap-2">
            {selectedBlock ? (
              selectedBlock.isFree ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Bloque seleccionado:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Espacio Libre de {selectedBlock.size} MB
                  </span>
                  <span className="text-slate-400 font-mono">
                    [{selectedBlock.start} MB - {selectedBlock.end} MB]
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedBlock.process?.color }}
                    />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      PID {selectedBlock.process?.pid} ({selectedBlock.process?.name})
                    </span>
                    <span className="text-slate-500 font-mono">
                      {selectedBlock.size} MB [{selectedBlock.start} - {selectedBlock.end} MB]
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono">
                      Quedan {selectedBlock.process?.remainingTime}s
                    </span>
                  </div>
                  <button
                    onClick={() => handleTerminateProcess(selectedBlock.process!.pid)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    Terminar Proceso (Kill)
                  </button>
                </div>
              )
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                💡 Haz clic o pasa el ratón sobre cualquier segmento de la barra de memoria para inspeccionar sus detalles.
              </span>
            )}
          </div>
        </section>

        {/* Panel Principal: Creación de Proceso y Tablas */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Formulario Crear Proceso (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <PlusCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Crear Proceso
                  </h3>
                </div>
                <button
                  onClick={handleGenerateRandomProcess}
                  type="button"
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  title="Generar proceso aleatorio"
                >
                  <Dices className="w-3.5 h-3.5 mr-1" />
                  Aleatorio
                </button>
              </div>

              <form onSubmit={handleCreateProcess} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Proceso (Opcional)
                  </label>
                  <input
                    type="text"
                    value={procName}
                    onChange={(e) => setProcName(e.target.value)}
                    placeholder="Ej. WebBrowser, DB_Server..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    PID Personalizado (Opcional)
                  </label>
                  <input
                    type="number"
                    value={procPid}
                    onChange={(e) => setProcPid(e.target.value)}
                    placeholder={`Automático (Ej. ${simState.nextPid})`}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Memoria RAM Requerida
                    </label>
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {procRam} MB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={512}
                    step={16}
                    value={procRam}
                    onChange={(e) => setProcRam(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[32, 64, 128, 256, 512].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setProcRam(preset)}
                        className={`flex-1 py-1 text-[10px] font-mono rounded-lg border transition-colors ${
                          procRam === preset
                            ? "bg-cyan-500 text-white border-cyan-600 font-bold"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500"
                        }`}
                      >
                        {preset}M
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Duración de Ejecución
                    </label>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {procDuration} segundos
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={procDuration}
                    onChange={(e) => setProcDuration(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar a Simulación
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Pestañas de Procesos y Logs (8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm backdrop-blur-md flex flex-col">
            {/* Cabecera de pestañas */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("running")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === "running"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  En Ejecución ({runningProcesses.length})
                </button>

                <button
                  onClick={() => setActiveTab("waiting")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === "waiting"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  Cola de Espera ({waitingProcesses.length})
                </button>

                <button
                  onClick={() => setActiveTab("logs")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === "logs"
                      ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Auditoría / Logs
                </button>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                {activeTab === "running" && "Asignados en RAM"}
                {activeTab === "waiting" && "En espera por espacio contiguo"}
                {activeTab === "logs" && "Eventos del Kernel"}
              </span>
            </div>

            {/* Contenido según pestaña */}
            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5">
              {activeTab === "running" && (
                runningProcesses.length > 0 ? (
                  runningProcesses.map((proc) => {
                    const progress =
                      proc.duration > 0
                        ? Math.round(((proc.duration - proc.remainingTime) / proc.duration) * 100)
                        : 100;

                    return (
                      <div
                        key={proc.pid}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: proc.color }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                #{proc.pid}
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {proc.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              RAM: {proc.requiredMemory} MB [{proc.memoryStartAddress} -{" "}
                              {proc.memoryEndAddress} MB]
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 text-right">
                            <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                              {proc.remainingTime}s rest.
                            </span>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleTerminateProcess(proc.pid)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Terminar proceso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No hay procesos en ejecución en este momento.
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Crea un proceso a la izquierda o pulsa &quot;Aleatorio&quot; para asignarlo a la RAM.
                    </p>
                  </div>
                )
              )}

              {activeTab === "waiting" && (
                waitingProcesses.length > 0 ? (
                  waitingProcesses.map((proc, index) => (
                    <div
                      key={proc.pid}
                      className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              PID {proc.pid}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                              {proc.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                            Requiere bloque contiguo de: {proc.requiredMemory} MB (Duración: {proc.duration}s)
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTerminateProcess(proc.pid)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        title="Quitar de la cola"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      La cola de espera está vacía.
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Si creas procesos que excedan la memoria libre continua, se formarán aquí en orden FIFO.
                    </p>
                  </div>
                )
              )}

              {activeTab === "logs" && (
                simState.logs.length > 0 ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    {simState.logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-[11px]"
                      >
                        <span className="text-cyan-600 dark:text-cyan-400 shrink-0 font-bold">
                          [T+{log.tick}s]
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {log.message}
                        </span>
                        <span className="ml-auto text-[10px] text-slate-400 shrink-0">
                          {log.time}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">No hay registros aún.</div>
                )
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
