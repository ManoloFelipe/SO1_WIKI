"""
Motor de Transacciones Concurrentes - Sistemas Operativos 1 (UMG)
Implementa:
  - Cuentas A, B, C con saldos en enteros e invariante A + B + C = 3000.
  - Hilos reales del SO (threading.Thread) con PID y TID nativo (threading.get_native_id()).
  - Exclusión mutua con threading.Lock por cuenta.
  - Sincronización y registro protegido con monitor (threading.Condition).
  - Demostración de condición de carrera con threading.Barrier(2).
  - Demostración de interbloqueo genuino (4 condiciones de Coffman).
  - Grafo de Asignación de Recursos (RAG) con detección de ciclos por DFS.
  - Cancelación cooperativa de víctima (T2) y liberación en bloque finally.
"""

import os
import sys
import time
import threading
import queue
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

class TransactionEngine:
    def __init__(self):
        # 1. Recursos Lógicos: Cuentas
        self.accounts: Dict[str, int] = {"A": 1000, "B": 1000, "C": 1000}
        self.account_locks: Dict[str, threading.Lock] = {
            "A": threading.Lock(),
            "B": threading.Lock(),
            "C": threading.Lock(),
        }

        # 2. Monitor para protección de metadatos (propietarios y esperas)
        self.monitor_lock = threading.RLock()
        self.condition = threading.Condition(self.monitor_lock)

        # Registro del estado del RAG
        # propietarios[recurso] = hilo_nombre (recurso -> hilo: posesión)
        self.propietarios: Dict[str, Optional[str]] = {"A": None, "B": None, "C": None}
        # esperas[hilo_nombre] = recurso (hilo -> recurso: solicitud pendiente)
        self.esperas: Dict[str, Optional[str]] = {}
        # banderas de cancelación cooperativa por hilo
        self.cancel_flags: Dict[str, bool] = {}
        # accesos concurrentes en carrera desprotegida
        self.race_accesses: Dict[str, str] = {}

        # 3. Registro de eventos cronológicos (Bitácora)
        self.event_counter = 0
        self.events: List[Dict[str, Any]] = []

        # 4. Estado de los hilos registrados (T1, T2, T3, T4, Guardián)
        self.threads_info: Dict[str, Dict[str, Any]] = {}

        # 5. Cola de trabajo sincronizada para modo normal
        self.work_queue: queue.Queue = queue.Queue()

        # 6. Escenario activo y ciclo detectado
        self.current_scenario: str = "IDLE"
        self.detected_cycle: List[str] = []
        self.detected_cycle_edges: List[List[str]] = []

        # 7. Control del hilo guardián
        self.guardian_running = False
        self.guardian_thread: Optional[threading.Thread] = None

        # 8. Barreras para pruebas instrumentadas
        self.race_barrier: Optional[threading.Barrier] = None
        self.deadlock_barrier: Optional[threading.Barrier] = None

        # 9. Modo Paso a Paso Pedagógico
        self.is_step_mode: bool = False
        self.step_scenario: str = "DEADLOCK"
        self.current_step_idx: int = 0
        self.step_definitions: List[Dict[str, Any]] = []

        # Registro inicial
        self._log_event(
            tid=threading.get_native_id(),
            event_type="INIT",
            resource=None,
            detail=f"Motor de transacciones iniciado en PID {os.getpid()}."
        )

    def _log_event(self, tid: int, event_type: str, resource: Optional[str], detail: str, thread_name: Optional[str] = None):
        with self.monitor_lock:
            self.event_counter += 1
            evt = {
                "id": self.event_counter,
                "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                "tid": tid,
                "thread_name": thread_name or threading.current_thread().name,
                "event_type": event_type,
                "resource": resource,
                "detail": detail,
            }
            self.events.insert(0, evt)
            if len(self.events) > 150:
                self.events.pop()

    # =========================================================================
    # DETECCIÓN DE CICLOS (RAG & DFS)
    # =========================================================================
    def build_rag(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Construye nodos y aristas del Grafo de Asignación de Recursos:
          - Nodos T: Hilos activos involucrados
          - Nodos R: Recursos A, B, C
          - Aristas R -> T: Posesión
          - Aristas T -> R: Espera
        """
        with self.monitor_lock:
            nodes = [
                {"id": "A", "type": "RESOURCE", "label": "Cuenta A (Lock A)"},
                {"id": "B", "type": "RESOURCE", "label": "Cuenta B (Lock B)"},
                {"id": "C", "type": "RESOURCE", "label": "Cuenta C (Lock C)"},
            ]

            # Seleccionar estrictamente los hilos correspondientes al escenario activo
            if self.current_scenario == "NORMAL":
                scenario_threads = [k for k in self.threads_info.keys() if k.startswith("Trabajador_")]
                if not scenario_threads:
                    scenario_threads = ["Trabajador_1", "Trabajador_2", "Trabajador_3", "Trabajador_4"]
            elif self.current_scenario in ["DEADLOCK", "RECOVERED", "RACE_UNPROTECTED", "RACE_PROTECTED"]:
                scenario_threads = ["T1", "T2"]
            else:
                scenario_threads = []

            for t_name in scenario_threads:
                info = self.threads_info.get(t_name, {})
                nodes.append({
                    "id": t_name,
                    "type": "THREAD",
                    "label": f"{t_name} (TID {info.get('tid', '?')})",
                })

            edges = []
            # Posesión: Recurso R -> Hilo T
            for res, t_owner in self.propietarios.items():
                if t_owner and t_owner in scenario_threads:
                    edges.append({
                        "from": res,
                        "to": t_owner,
                        "type": "HOLDING",
                        "label": "Posee",
                    })

            # Espera: Hilo T -> Recurso R
            for t_requester, res in self.esperas.items():
                if res and t_requester in scenario_threads:
                    edges.append({
                        "from": t_requester,
                        "to": res,
                        "type": "WAITING",
                        "label": "Espera",
                    })

            # En carrera desprotegida, graficar el acceso concurrente sin lock
            if self.current_scenario == "RACE_UNPROTECTED":
                for t_name, res in self.race_accesses.items():
                    if t_name in scenario_threads:
                        edges.append({
                            "from": t_name,
                            "to": res,
                            "type": "RACE_CONFLICT",
                            "label": f"Lee {res} sin Lock",
                        })

            return nodes, edges

    def detect_cycle_dfs(self) -> Tuple[List[str], List[List[str]]]:
        """
        Ejecuta DFS para buscar ciclos en el grafo dirigido RAG.
        Devuelve (lista_de_nodos_en_ciclo, lista_de_aristas_en_ciclo).
        Ejemplo de ciclo: ['T1', 'B', 'T2', 'A', 'T1']
        """
        with self.monitor_lock:
            adj: Dict[str, List[str]] = {}
            for res, t_owner in self.propietarios.items():
                if t_owner:
                    adj.setdefault(res, []).append(t_owner)
            for t_requester, res in self.esperas.items():
                if res:
                    adj.setdefault(t_requester, []).append(res)

            visited = set()
            rec_stack = []

            def dfs(curr: str) -> Optional[List[str]]:
                visited.add(curr)
                rec_stack.append(curr)

                for neighbor in adj.get(curr, []):
                    if neighbor not in visited:
                        res = dfs(neighbor)
                        if res:
                            return res
                    elif neighbor in rec_stack:
                        # Ciclo encontrado
                        idx = rec_stack.index(neighbor)
                        cycle = rec_stack[idx:] + [neighbor]
                        return cycle

                rec_stack.pop()
                return None

            all_nodes = list(adj.keys())
            for node in all_nodes:
                if node not in visited:
                    cycle = dfs(node)
                    if cycle:
                        edges = []
                        for i in range(len(cycle) - 1):
                            edges.append([cycle[i], cycle[i + 1]])
                        return cycle, edges

            return [], []

    # =========================================================================
    # HILO GUARDIÁN
    # =========================================================================
    def start_guardian(self):
        if self.guardian_running:
            return
        self.guardian_running = True

        def guardian_loop():
            tid = threading.get_native_id()
            self._register_thread("Guardián", tid, "MONITOR")
            self._log_event(tid, "GUARDIAN_START", None, f"Hilo Guardián activo con TID {tid}.", "Guardián")

            while self.guardian_running:
                time.sleep(0.5)
                cycle, cycle_edges = self.detect_cycle_dfs()
                with self.monitor_lock:
                    self.detected_cycle = cycle
                    self.detected_cycle_edges = cycle_edges

                if cycle:
                    cycle_str = " -> ".join(cycle)
                    self._log_event(
                        tid,
                        "DEADLOCK_DETECTED",
                        None,
                        f"¡Interbloqueo detectado por DFS! Ciclo: {cycle_str}",
                        "Guardián"
                    )
                    # No repetimos el log continuamente mientras dure el deadlock
                    time.sleep(2.0)

        self.guardian_thread = threading.Thread(target=guardian_loop, name="Guardián", daemon=True)
        self.guardian_thread.start()

    def _register_thread(self, name: str, tid: int, role: str):
        with self.monitor_lock:
            self.threads_info[name] = {
                "name": name,
                "tid": tid,
                "role": role,
                "status": "RUNNING",
                "holding": [],
                "waiting": None,
            }

    # =========================================================================
    # ESCENARIO 1: TRANSFERENCIA NORMAL (ORDEN FIJO DE LOCKS)
    # =========================================================================
    def execute_normal_transfer(self, source: str, target: str, amount: int, worker_name: str):
        """
        Ejecuta una transferencia en modo normal.
        Regla de exclusión mutua:
          Se adquieren los locks en ORDEN ALFABÉTICO FIJO (ej. A antes que B, B antes que C).
          Esto elimina matemáticamente la posibilidad de espera circular (Condición 4 de Coffman).
        """
        tid = threading.get_native_id()
        self._register_thread(worker_name, tid, "WORKER")

        # Orden consistente de adquisición
        first_res, second_res = (source, target) if source < target else (target, source)
        lock1 = self.account_locks[first_res]
        lock2 = self.account_locks[second_res]

        # 1. Solicitar primer recurso bajo el monitor
        with self.condition:
            self.esperas[worker_name] = first_res
            self.threads_info[worker_name]["waiting"] = first_res
            self.threads_info[worker_name]["status"] = "WAITING"
            self._log_event(tid, "ESPERA", first_res, f"{worker_name} solicita Lock de Cuenta {first_res}", worker_name)

        # Adquirir el primer lock real
        lock1.acquire()

        with self.condition:
            self.esperas[worker_name] = None
            self.propietarios[first_res] = worker_name
            self.threads_info[worker_name]["waiting"] = None
            self.threads_info[worker_name]["holding"].append(first_res)
            self._log_event(tid, "ADQUISICIÓN", first_res, f"{worker_name} adquirió Lock de Cuenta {first_res}", worker_name)

        try:
            # 2. Solicitar segundo recurso bajo el monitor
            with self.condition:
                self.esperas[worker_name] = second_res
                self.threads_info[worker_name]["waiting"] = second_res
                self.threads_info[worker_name]["status"] = "WAITING"
                self._log_event(tid, "ESPERA", second_res, f"{worker_name} solicita Lock de Cuenta {second_res}", worker_name)

            lock2.acquire()

            with self.condition:
                self.esperas[worker_name] = None
                self.propietarios[second_res] = worker_name
                self.threads_info[worker_name]["waiting"] = None
                self.threads_info[worker_name]["holding"].append(second_res)
                self.threads_info[worker_name]["status"] = "CRITICAL_SECTION"
                self._log_event(tid, "ADQUISICIÓN", second_res, f"{worker_name} adquirió Lock de Cuenta {second_res}. Ambos obtenidos.", worker_name)

            try:
                # 3. Sección Crítica Protegida: Validación y actualización conjunta
                time.sleep(0.5)  # Tiempo observable para que el frontend aprecie la posesión de ambos locks
                if self.accounts[source] >= amount:
                    self.accounts[source] -= amount
                    self.accounts[target] += amount
                    total = sum(self.accounts.values())
                    self._log_event(
                        tid,
                        "TRANSFER_SUCCESS",
                        f"{source}->{target}",
                        f"Transferencia de {amount} exitosa. Saldo {source}: {self.accounts[source]}, Saldo {target}: {self.accounts[target]}. Total: {total}",
                        worker_name
                    )
                else:
                    self._log_event(
                        tid,
                        "TRANSFER_REJECTED",
                        source,
                        f"Fondos insuficientes en {source} ({self.accounts[source]} < {amount}). Transferencia rechazada.",
                        worker_name
                    )
            finally:
                # 4. Liberación en orden inverso bajo finally
                try:
                    lock2.release()
                except RuntimeError:
                    pass
                with self.condition:
                    self.propietarios[second_res] = None
                    if second_res in self.threads_info[worker_name]["holding"]:
                        self.threads_info[worker_name]["holding"].remove(second_res)
                    self._log_event(tid, "LIBERACIÓN", second_res, f"{worker_name} liberó Lock {second_res}", worker_name)
                    self.condition.notify_all()
        finally:
            try:
                lock1.release()
            except RuntimeError:
                pass
            with self.condition:
                self.propietarios[first_res] = None
                if first_res in self.threads_info[worker_name]["holding"]:
                    self.threads_info[worker_name]["holding"].remove(first_res)
                self.threads_info[worker_name]["status"] = "IDLE"
                self._log_event(tid, "LIBERACIÓN", first_res, f"{worker_name} liberó Lock {first_res}", worker_name)
                self.condition.notify_all()

    def run_normal_batch(self, count: int = 4):
        """Dispara un lote de transferencias válidas concurrentes con 4 hilos trabajadores."""
        with self.monitor_lock:
            self.current_scenario = "NORMAL"
            self.threads_info.clear()
            self.esperas.clear()
            self.race_accesses.clear()
            self.detected_cycle.clear()
            self.detected_cycle_edges.clear()
            for res in self.propietarios:
                self.propietarios[res] = None
            self.account_locks = {"A": threading.Lock(), "B": threading.Lock(), "C": threading.Lock()}

        transfers = [
            ("A", "B", 100),
            ("B", "C", 50),
            ("C", "A", 80),
            ("A", "C", 60),
            ("B", "A", 120),
            ("C", "B", 40),
        ]

        def worker_task(idx):
            w_name = f"Trabajador_{idx + 1}"
            src, tgt, amt = transfers[idx % len(transfers)]
            self.execute_normal_transfer(src, tgt, amt, w_name)

        threads = []
        for i in range(min(count, 4)):
            t = threading.Thread(target=worker_task, args=(i,), name=f"Trabajador_{i + 1}")
            threads.append(t)
            t.start()

    # =========================================================================
    # ESCENARIO 2: CONDICIÓN DE CARRERA DEMOSTRABLE (SIN LOCKS vs CON LOCKS)
    # =========================================================================
    def run_race_condition(self, protected: bool = False):
        """
        Demuestra la actualización perdida (Lost Update):
          Desde A = 1000, T1 envía 100 a B y T2 envía 200 a C.
          - Si protected=False:
              T1 y T2 leen A=1000.
              Una Barrier(2) sincroniza ambos hilos justo después de leer y antes de escribir.
              Al cruzar la barrera, ambos calculan y escriben (uno calcula 900, otro calcula 800).
              Uno sobreescribe al otro: queda 800 o 900 (en vez de 700).
              B y C reciben abonos: el total pasa a 3100 o 3200 (¡Invariante roto!).
          - Si protected=True:
              Con exclusión mutua, uno opera y actualiza A antes que el otro. Saldo A=700, total=3000.
        """
        with self.monitor_lock:
            self.current_scenario = "RACE_PROTECTED" if protected else "RACE_UNPROTECTED"
            self.accounts = {"A": 1000, "B": 1000, "C": 1000}
            self.threads_info.clear()
            self.esperas.clear()
            self.race_accesses.clear()
            self.detected_cycle.clear()
            self.detected_cycle_edges.clear()
            for res in self.propietarios:
                self.propietarios[res] = None
            self.account_locks = {"A": threading.Lock(), "B": threading.Lock(), "C": threading.Lock()}

        barrier = threading.Barrier(2)

        def t1_action():
            tid = threading.get_native_id()
            self._register_thread("T1", tid, "WORKER")

            if not protected:
                # 1. Leer saldo A sin lock
                with self.monitor_lock:
                    self.race_accesses["T1"] = "A"
                    self.threads_info["T1"]["status"] = "RACE_READ (Sin Lock)"
                saldo_leido = self.accounts["A"]
                self._log_event(tid, "RACE_READ", "A", f"T1 leyó Saldo A = {saldo_leido} sin exclusión mutua.", "T1")

                # Dar tiempo observable en pantalla para capturar la concurrencia en la interfaz
                time.sleep(1.0)
                barrier.wait()

                # 2. Calcular y escribir
                with self.monitor_lock:
                    self.threads_info["T1"]["status"] = "RACE_WRITE"
                nuevo_a = saldo_leido - 100
                time.sleep(0.3)
                self.accounts["A"] = nuevo_a
                self.accounts["B"] += 100
                self._log_event(
                    tid, "RACE_WRITE", "A",
                    f"T1 escribió Saldo A = {nuevo_a} (calculado de lectura antigua {saldo_leido}). Total actual: {sum(self.accounts.values())}",
                    "T1"
                )
                time.sleep(1.0)
                with self.monitor_lock:
                    if "T1" in self.threads_info:
                        self.threads_info["T1"]["status"] = "COMPLETED"
            else:
                self.execute_normal_transfer("A", "B", 100, "T1")

        def t2_action():
            tid = threading.get_native_id()
            self._register_thread("T2", tid, "WORKER")

            if not protected:
                # 1. Leer saldo A sin lock
                with self.monitor_lock:
                    self.race_accesses["T2"] = "A"
                    self.threads_info["T2"]["status"] = "RACE_READ (Sin Lock)"
                saldo_leido = self.accounts["A"]
                self._log_event(tid, "RACE_READ", "A", f"T2 leyó Saldo A = {saldo_leido} sin exclusión mutua.", "T2")

                time.sleep(1.0)
                barrier.wait()

                # 2. Calcular y escribir
                with self.monitor_lock:
                    self.threads_info["T2"]["status"] = "RACE_WRITE"
                nuevo_a = saldo_leido - 200
                time.sleep(0.5)
                self.accounts["A"] = nuevo_a
                self.accounts["C"] += 200
                self._log_event(
                    tid, "RACE_WRITE", "A",
                    f"T2 escribió Saldo A = {nuevo_a} (calculado de lectura antigua {saldo_leido}). Total actual: {sum(self.accounts.values())}",
                    "T2"
                )
                time.sleep(1.0)
                with self.monitor_lock:
                    if "T2" in self.threads_info:
                        self.threads_info["T2"]["status"] = "COMPLETED"
            else:
                time.sleep(0.2)
                self.execute_normal_transfer("A", "C", 200, "T2")

        th1 = threading.Thread(target=t1_action, name="T1")
        th2 = threading.Thread(target=t2_action, name="T2")
        th1.start()
        th2.start()

    # =========================================================================
    # ESCENARIO 3: MODO CAÓTICO E INTERBLOQUEO (COFFMAN & DEADLOCK)
    # =========================================================================
    def run_deadlock(self):
        """
        Inyecta un interbloqueo genuino cumpliendo las 4 condiciones de Coffman:
          1. Exclusión mutua (un dueño por lock).
          2. Retención y espera (cada uno conserva su primer lock).
          3. Ausencia de expropiación (nadie arrebata el lock por la fuerza).
          4. Espera circular: T1 posee A y solicita B; T2 posee B y solicita A.

        Sincronizado con una Barrier(2) después de tomar el primer lock
        para asegurar que ambos tengan su recurso antes de solicitar el segundo.
        """
        with self.monitor_lock:
            self.current_scenario = "DEADLOCK"
            self.threads_info.clear()
            self.esperas.clear()
            self.race_accesses.clear()
            self.detected_cycle.clear()
            self.detected_cycle_edges.clear()
            for res in self.propietarios:
                self.propietarios[res] = None
            self.account_locks = {"A": threading.Lock(), "B": threading.Lock(), "C": threading.Lock()}
            self.cancel_flags["T1"] = False
            self.cancel_flags["T2"] = False

        barrier = threading.Barrier(2)

        with self.monitor_lock:
            self.cancel_flags["T1"] = False
            self.cancel_flags["T2"] = False

        def t1_worker():
            tid = threading.get_native_id()
            self._register_thread("T1", tid, "WORKER")
            lock_a = self.account_locks["A"]
            lock_b = self.account_locks["B"]

            # 1. T1 toma Lock A
            lock_a.acquire()
            with self.condition:
                self.propietarios["A"] = "T1"
                self.threads_info["T1"]["holding"] = ["A"]
                self._log_event(tid, "ADQUISICIÓN", "A", "T1 retiene Lock Cuenta A.", "T1")

            try:
                # Barrier(2) para sincronizar retención con T2
                barrier.wait()

                # 2. T1 solicita Lock B (retenido por T2)
                with self.condition:
                    self.esperas["T1"] = "B"
                    self.threads_info["T1"]["waiting"] = "B"
                    self.threads_info["T1"]["status"] = "DEADLOCKED"
                    self._log_event(tid, "ESPERA", "B", "T1 solicita Lock Cuenta B (retenido por T2).", "T1")

                # Intento de adquisición bajo monitor cancelable
                acquired_b = False
                while not acquired_b:
                    with self.condition:
                        if self.cancel_flags.get("T1", False):
                            self._log_event(tid, "CANCELADO", "B", "T1 notificado para cancelación.", "T1")
                            break
                        # Intentar adquirir B sin bloqueo del monitor
                        if lock_b.acquire(blocking=False):
                            acquired_b = True
                            self.esperas["T1"] = None
                            self.propietarios["B"] = "T1"
                            self.threads_info["T1"]["waiting"] = None
                            self.threads_info["T1"]["holding"].append("B")
                            self.threads_info["T1"]["status"] = "RUNNING"
                            self._log_event(tid, "ADQUISICIÓN", "B", "T1 adquirió Lock B tras desbloqueo.", "T1")
                            break
                        else:
                            # Esperar notificación de Condition
                            self.condition.wait(timeout=1.0)

                if acquired_b:
                    try:
                        # Realizar transferencia A -> B de 100
                        time.sleep(0.1)
                        if self.accounts["A"] >= 100:
                            self.accounts["A"] -= 100
                            self.accounts["B"] += 100
                            self._log_event(tid, "TRANSFER_SUCCESS", "A->B", "T1 completó transferencia A -> B por 100.", "T1")
                    finally:
                        try:
                            lock_b.release()
                        except RuntimeError:
                            pass
                        with self.condition:
                            self.propietarios["B"] = None
                            if "B" in self.threads_info["T1"]["holding"]:
                                self.threads_info["T1"]["holding"].remove("B")
                            self._log_event(tid, "LIBERACIÓN", "B", "T1 liberó Lock B.", "T1")
                            self.condition.notify_all()
            finally:
                try:
                    lock_a.release()
                except RuntimeError:
                    pass
                with self.condition:
                    self.propietarios["A"] = None
                    self.esperas.pop("T1", None)
                    if "A" in self.threads_info["T1"]["holding"]:
                        self.threads_info["T1"]["holding"].remove("A")
                    self.threads_info["T1"]["status"] = "COMPLETED"
                    self._log_event(tid, "LIBERACIÓN", "A", "T1 liberó Lock A en finally.", "T1")
                    self.condition.notify_all()

        def t2_worker():
            tid = threading.get_native_id()
            self._register_thread("T2", tid, "WORKER")
            lock_a = self.account_locks["A"]
            lock_b = self.account_locks["B"]

            # 1. T2 toma Lock B
            lock_b.acquire()
            with self.condition:
                self.propietarios["B"] = "T2"
                self.threads_info["T2"]["holding"] = ["B"]
                self._log_event(tid, "ADQUISICIÓN", "B", "T2 retiene Lock Cuenta B.", "T2")

            try:
                # Sincronizar con T1
                barrier.wait()

                # 2. T2 solicita Lock A (retenido por T1)
                with self.condition:
                    self.esperas["T2"] = "A"
                    self.threads_info["T2"]["waiting"] = "A"
                    self.threads_info["T2"]["status"] = "DEADLOCKED"
                    self._log_event(tid, "ESPERA", "A", "T2 solicita Lock Cuenta A (retenido por T1).", "T2")

                # Intento de adquisición bajo monitor cancelable
                acquired_a = False
                while not acquired_a:
                    with self.condition:
                        if self.cancel_flags.get("T2", False):
                            self._log_event(
                                tid,
                                "CANCELADO_COOPERATIVO",
                                "A",
                                "T2 recibió orden de cancelación cooperativa del Guardián. Abandona solicitud de A.",
                                "T2"
                            )
                            self.esperas.pop("T2", None)
                            self.threads_info["T2"]["waiting"] = None
                            self.threads_info["T2"]["status"] = "CANCELLED"
                            break

                        if lock_a.acquire(blocking=False):
                            acquired_a = True
                            self.esperas["T2"] = None
                            self.propietarios["A"] = "T2"
                            self.threads_info["T2"]["waiting"] = None
                            self.threads_info["T2"]["holding"].append("A")
                            self.threads_info["T2"]["status"] = "RUNNING"
                            self._log_event(tid, "ADQUISICIÓN", "A", "T2 adquirió Lock A.", "T2")
                            break
                        else:
                            self.condition.wait(timeout=1.0)

                if acquired_a:
                    try:
                        time.sleep(0.1)
                        if self.accounts["B"] >= 100:
                            self.accounts["B"] -= 100
                            self.accounts["A"] += 100
                    finally:
                        try:
                            lock_a.release()
                        except RuntimeError:
                            pass
                        with self.condition:
                            self.propietarios["A"] = None
                            if "A" in self.threads_info["T2"]["holding"]:
                                self.threads_info["T2"]["holding"].remove("A")
                            self.condition.notify_all()
            finally:
                # 3. Al cancelar, T2 libera su propio Lock B en el finally
                try:
                    lock_b.release()
                except RuntimeError:
                    pass
                with self.condition:
                    self.propietarios["B"] = None
                    self.esperas.pop("T2", None)
                    if "B" in self.threads_info["T2"]["holding"]:
                        self.threads_info["T2"]["holding"].remove("B")
                    self._log_event(tid, "LIBERACIÓN", "B", "T2 liberó su Lock B en bloque finally tras cancelación.", "T2")
                    self.condition.notify_all()

        th1 = threading.Thread(target=t1_worker, name="T1")
        th2 = threading.Thread(target=t2_worker, name="T2")
        th1.start()
        th2.start()

    # =========================================================================
    # ESCENARIO 4: RECUPERACIÓN COOPERATIVA POR EL GUARDIÁN
    # =========================================================================
    def recover_deadlock(self) -> Dict[str, Any]:
        """
        El Guardián ejecuta la recuperación:
          1. Verifica el ciclo bajo el monitor.
          2. Selecciona a T2 como víctima reproducible.
          3. Marca cancel_flags['T2'] = True y notifica a la condición.
          4. T2 despierta, retira su solicitud de A y libera B en finally.
          5. T1 se desbloquea, toma B, realiza su transacción y libera A y B.
          6. El ciclo desaparece y la suma permanece íntegra en 3000.
        """
        with self.condition:
            cycle, _ = self.detect_cycle_dfs()
            if not cycle and "T2" not in self.esperas and "T1" not in self.esperas:
                return {"success": False, "message": "No hay interbloqueo activo para recuperar."}

            # Selección de víctima
            victim = "T2"
            self.cancel_flags[victim] = True
            tid = threading.get_native_id()
            self._log_event(
                tid,
                "RECOVERY_TRIGGERED",
                None,
                f"Guardián seleccionó a {victim} como víctima. Enviando señal de cancelación cooperativa...",
                "Guardián"
            )
            # Despertar hilos esperando bajo la condición
            self.condition.notify_all()

        self.current_scenario = "RECOVERED"
        return {"success": True, "message": f"Víctima {victim} notificada para cancelación cooperativa."}

    # =========================================================================
    # REINICIO Y SNAPSHOT
    # =========================================================================
    def reset_state(self):
        """Reinicia los saldos y limpia estructuras."""
        with self.monitor_lock:
            self.accounts = {"A": 1000, "B": 1000, "C": 1000}
            self.current_scenario = "IDLE"
            self.esperas.clear()
            self.cancel_flags.clear()
            self.threads_info.clear()
            self.race_accesses.clear()
            self.is_step_mode = False
            self.current_step_idx = 0
            self.step_definitions = []
            for res in self.propietarios:
                self.propietarios[res] = None
            self.account_locks = {"A": threading.Lock(), "B": threading.Lock(), "C": threading.Lock()}

            tid = threading.get_native_id()
            self._log_event(tid, "RESET", None, "Estado reiniciado: Cuentas A=1000, B=1000, C=1000 (Total=3000).", "Sistema")

    def get_snapshot(self) -> Dict[str, Any]:
        """Toma una instantánea consistente del estado completo para el frontend."""
        with self.monitor_lock:
            total_balance = sum(self.accounts.values())
            nodes, edges = self.build_rag()
            cycle, cycle_edges = self.detect_cycle_dfs()

            # Resumen de hilos
            workers_summary = []
            for name, info in list(self.threads_info.items()):
                holding = [res for res, owner in self.propietarios.items() if owner == name]
                waiting = self.esperas.get(name)
                workers_summary.append({
                    "name": name,
                    "tid": info.get("tid"),
                    "role": info.get("role", "WORKER"),
                    "status": info.get("status", "IDLE"),
                    "holding": holding,
                    "waiting": waiting,
                })

            step_info = {
                "active": self.is_step_mode,
                "scenario": self.step_scenario if self.is_step_mode else None,
                "current_step": self.current_step_idx if self.is_step_mode else 0,
                "total_steps": len(self.step_definitions) if self.is_step_mode else 0,
                "title": self.step_definitions[self.current_step_idx]["title"] if self.is_step_mode and self.step_definitions else None,
                "os_concept": self.step_definitions[self.current_step_idx].get("os_concept", "") if self.is_step_mode and self.step_definitions else None,
                "description": self.step_definitions[self.current_step_idx].get("description", "") if self.is_step_mode and self.step_definitions else None,
                "can_next": self.is_step_mode and (self.current_step_idx < len(self.step_definitions) - 1),
                "can_prev": self.is_step_mode and (self.current_step_idx > 0),
            }

            return {
                "server_info": {
                    "pid": os.getpid(),
                    "platform": sys.platform,
                    "python_version": sys.version.split()[0],
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                },
                "scenario": self.current_scenario,
                "accounts": {
                    "A": self.accounts.get("A", 1000),
                    "B": self.accounts.get("B", 1000),
                    "C": self.accounts.get("C", 1000),
                    "total": total_balance,
                    "invariant_satisfied": total_balance == 3000,
                },
                "workers": workers_summary,
                "rag": {
                    "nodes": nodes,
                    "edges": edges,
                    "cycle_detected": len(cycle) > 0,
                    "cycle_path": cycle,
                    "cycle_edges": cycle_edges,
                },
                "events": self.events[:60],
                "step_info": step_info,
            }

    # =========================================================================
    # SERVICIOS ALEDANOS: MODO PASO A PASO DIDACTICO DEL GRAFO
    # =========================================================================
    def init_step_mode(self, scenario: str = "DEADLOCK") -> Dict[str, Any]:
        """Inicializa el modo paso a paso para un escenario didáctico específico."""
        with self.monitor_lock:
            self.is_step_mode = True
            sc_key = scenario.upper()
            if "RACE" in sc_key:
                self.step_scenario = "RACE"
            elif "NORM" in sc_key:
                self.step_scenario = "NORMAL"
            else:
                self.step_scenario = "DEADLOCK"

            self.step_definitions = self._build_steps_for_scenario(self.step_scenario)
            self.current_step_idx = 0
            self._apply_current_step()
            return self.get_snapshot()

    def next_step(self) -> Dict[str, Any]:
        """Avanza al siguiente paso atómico en la secuencia pedagógica."""
        with self.monitor_lock:
            if not self.is_step_mode or not self.step_definitions:
                return self.init_step_mode("DEADLOCK")

            if self.current_step_idx < len(self.step_definitions) - 1:
                self.current_step_idx += 1
                self._apply_current_step()
            return self.get_snapshot()

    def prev_step(self) -> Dict[str, Any]:
        """Retrocede al paso atómico anterior."""
        with self.monitor_lock:
            if not self.is_step_mode or not self.step_definitions:
                return self.get_snapshot()

            if self.current_step_idx > 0:
                self.current_step_idx -= 1
                self._apply_current_step()
            return self.get_snapshot()

    def reset_step(self) -> Dict[str, Any]:
        """Reinicia el escenario paso a paso al Paso 0."""
        with self.monitor_lock:
            if not self.is_step_mode or not self.step_definitions:
                return self.init_step_mode(self.step_scenario)

            self.current_step_idx = 0
            self._apply_current_step()
            return self.get_snapshot()

    def exit_step_mode(self) -> Dict[str, Any]:
        """Sale del modo paso a paso y restaura el estado continuo."""
        with self.monitor_lock:
            self.is_step_mode = False
            self.step_definitions = []
            self.current_step_idx = 0
            self.reset_state()
            return self.get_snapshot()

    def _apply_current_step(self):
        """Aplica el estado formal del paso seleccionado a las estructuras del motor."""
        if not self.step_definitions or self.current_step_idx >= len(self.step_definitions):
            return

        step = self.step_definitions[self.current_step_idx]
        self.current_scenario = step["scenario"]
        self.accounts = step["accounts"].copy()
        self.propietarios = step["propietarios"].copy()
        self.esperas = step["esperas"].copy()
        self.race_accesses = step.get("race_accesses", {}).copy()
        self.threads_info = {k: v.copy() for k, v in step["threads_info"].items()}

        tid = threading.get_native_id()
        self._log_event(
            tid=tid,
            event_type="PASO_A_PASO",
            resource=None,
            detail=f"[{step['title']}] {step['description']}",
            thread_name="PasoAPaso"
        )

    def _build_steps_for_scenario(self, scenario: str) -> List[Dict[str, Any]]:
        """Construye la secuencia de pasos atómicos con conceptos teóricos de SO."""
        if scenario == "RACE":
            return [
                {
                    "step": 0,
                    "title": "Paso 0: Estado Inicial Consistente",
                    "os_concept": "Invariante Base S = A + B + C = 3000",
                    "description": "Las cuentas tienen 1000u cada una. Hilos T1 y T2 listos para transferir sin exclusión mutua.",
                    "scenario": "RACE_UNPROTECTED",
                    "accounts": {"A": 1000, "B": 1000, "C": 1000},
                    "propietarios": {"A": None, "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {},
                    "threads_info": {
                        "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                    },
                },
                {
                    "step": 1,
                    "title": "Paso 1: Lectura Concurrente de A (Sin Lock)",
                    "os_concept": "Falta de Atomicidad en Lectura",
                    "description": "T1 y T2 leen el saldo de la Cuenta A en paralelo sin locks. Ambos capturan A = 1000. Se grafican aristas de contienda directa.",
                    "scenario": "RACE_UNPROTECTED",
                    "accounts": {"A": 1000, "B": 1000, "C": 1000},
                    "propietarios": {"A": None, "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {"T1": "A", "T2": "A"},
                    "threads_info": {
                        "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "RACE_READ (Leído: 1000)", "holding": [], "waiting": None},
                        "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "RACE_READ (Leído: 1000)", "holding": [], "waiting": None},
                    },
                },
                {
                    "step": 2,
                    "title": "Paso 2: T1 Aplica su Transacción (-100 a B)",
                    "os_concept": "Escritura Intercalada No Sincronizada",
                    "description": "T1 calcula 1000 - 100 = 900. Escribe A = 900 y abona 100 a B (B=1100). Total momentáneo = 3000.",
                    "scenario": "RACE_UNPROTECTED",
                    "accounts": {"A": 900, "B": 1100, "C": 1000},
                    "propietarios": {"A": None, "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {"T2": "A"},
                    "threads_info": {
                        "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "COMPLETED", "holding": [], "waiting": None},
                        "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "CALCULANDO (Base: 1000)", "holding": [], "waiting": None},
                    },
                },
                {
                    "step": 3,
                    "title": "Paso 3: T2 Sobreescribe A (Actualización Perdida)",
                    "os_concept": "¡Violación de Consistencia! (Lost Update)",
                    "description": "T2 calcula 1000 - 200 = 800 usando la lectura desfasada. Sobreescribe A = 800 y abona 200 a C. El débito de T1 se evaporó. Total = 3100 (Invariante violado).",
                    "scenario": "RACE_UNPROTECTED",
                    "accounts": {"A": 800, "B": 1100, "C": 1200},
                    "propietarios": {"A": None, "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {},
                    "threads_info": {
                        "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "COMPLETED (Actualización Perdida)", "holding": [], "waiting": None},
                        "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "COMPLETED (Sobreescritura)", "holding": [], "waiting": None},
                    },
                },
            ]

        if scenario == "NORMAL":
            return [
                {
                    "step": 0,
                    "title": "Paso 0: Estado Inicial en Modo Normal",
                    "os_concept": "Jerarquía de Recursos para Evitar Interbloqueos",
                    "description": "Los 4 trabajadores están listos. La regla impone orden alfabético estricto de adquisición (A antes de B, B antes de C) eliminando matemáticamente esperas circulares.",
                    "scenario": "NORMAL",
                    "accounts": {"A": 1000, "B": 1000, "C": 1000},
                    "propietarios": {"A": None, "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {},
                    "threads_info": {
                        "Trabajador_1": {"name": "Trabajador_1", "tid": 201, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_2": {"name": "Trabajador_2", "tid": 202, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_3": {"name": "Trabajador_3", "tid": 203, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_4": {"name": "Trabajador_4", "tid": 204, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                    },
                },
                {
                    "step": 1,
                    "title": "Paso 1: Trabajador_1 Adquiere Primer Lock (Lock A)",
                    "os_concept": "Exclusión Mutua Parcial",
                    "description": "Trabajador_1 adquiere el mutex de la Cuenta A (A < B). Se genera la arista de posesión A -> Trabajador_1.",
                    "scenario": "NORMAL",
                    "accounts": {"A": 1000, "B": 1000, "C": 1000},
                    "propietarios": {"A": "Trabajador_1", "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {},
                    "threads_info": {
                        "Trabajador_1": {"name": "Trabajador_1", "tid": 201, "role": "WORKER", "status": "HOLDING (Lock A)", "holding": ["A"], "waiting": None},
                        "Trabajador_2": {"name": "Trabajador_2", "tid": 202, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_3": {"name": "Trabajador_3", "tid": 203, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_4": {"name": "Trabajador_4", "tid": 204, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                    },
                },
                {
                    "step": 2,
                    "title": "Paso 2: Trabajador_1 Adquiere Segundo Lock (Lock B)",
                    "os_concept": "Entrada a Sección Crítica Protegida",
                    "description": "Trabajador_1 adquiere Lock B sin riesgo de espera circular. Retiene ambos locks y ejecuta la transferencia A -> B atómicamente.",
                    "scenario": "NORMAL",
                    "accounts": {"A": 1000, "B": 1000, "C": 1000},
                    "propietarios": {"A": "Trabajador_1", "B": "Trabajador_1", "C": None},
                    "esperas": {},
                    "race_accesses": {},
                    "threads_info": {
                        "Trabajador_1": {"name": "Trabajador_1", "tid": 201, "role": "WORKER", "status": "CRITICAL_SECTION", "holding": ["A", "B"], "waiting": None},
                        "Trabajador_2": {"name": "Trabajador_2", "tid": 202, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_3": {"name": "Trabajador_3", "tid": 203, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_4": {"name": "Trabajador_4", "tid": 204, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                    },
                },
                {
                    "step": 3,
                    "title": "Paso 3: Transferencia Exitosa y Liberación de Locks",
                    "os_concept": "Liberación en Orden Inverso & Invariante Íntegro",
                    "description": "Se transfirieron 100u de A a B (A=900, B=1100). Los locks se liberan en orden inverso (B y luego A). Total = 3000u preservado.",
                    "scenario": "NORMAL",
                    "accounts": {"A": 900, "B": 1100, "C": 1000},
                    "propietarios": {"A": None, "B": None, "C": None},
                    "esperas": {},
                    "race_accesses": {},
                    "threads_info": {
                        "Trabajador_1": {"name": "Trabajador_1", "tid": 201, "role": "WORKER", "status": "COMPLETED", "holding": [], "waiting": None},
                        "Trabajador_2": {"name": "Trabajador_2", "tid": 202, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_3": {"name": "Trabajador_3", "tid": 203, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                        "Trabajador_4": {"name": "Trabajador_4", "tid": 204, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                    },
                },
            ]

        # Por defecto: DEADLOCK (El más pedagógico y completo para el RAG)
        return [
            {
                "step": 0,
                "title": "Paso 0: Hilos y Recursos en Reposo",
                "os_concept": "Inicialización del Entorno Concurrente",
                "description": "Los hilos T1 y T2 están listos en memoria. Cuentas A, B y C libres con 1000u cada una.",
                "scenario": "DEADLOCK",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": None, "B": None, "C": None},
                "esperas": {},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                },
            },
            {
                "step": 1,
                "title": "Paso 1: T1 Adquiere Lock A",
                "os_concept": "Condición 1 de Coffman: Exclusión Mutua",
                "description": "T1 adquiere el mutex de la Cuenta A. Se añade la arista A -> T1. Ningún otro hilo puede acceder a A.",
                "scenario": "DEADLOCK",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": "T1", "B": None, "C": None},
                "esperas": {},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "HOLDING (Lock A)", "holding": ["A"], "waiting": None},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "READY", "holding": [], "waiting": None},
                },
            },
            {
                "step": 2,
                "title": "Paso 2: T2 Adquiere Lock B",
                "os_concept": "Condición 2 de Coffman: Retención y Espera (Hold & Wait)",
                "description": "T2 adquiere el Lock exclusivo de la Cuenta B. T1 retiene A y T2 retiene B concurrentemente.",
                "scenario": "DEADLOCK",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": "T1", "B": "T2", "C": None},
                "esperas": {},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "HOLDING (Lock A)", "holding": ["A"], "waiting": None},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "HOLDING (Lock B)", "holding": ["B"], "waiting": None},
                },
            },
            {
                "step": 3,
                "title": "Paso 3: T1 Solicita Lock B (Bloqueado)",
                "os_concept": "Bloqueo por Recurso Ocupado",
                "description": "T1 desea transferir a B y solicita Lock B. Como B está en poder de T2, T1 queda en espera. Arista T1 -> B.",
                "scenario": "DEADLOCK",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": "T1", "B": "T2", "C": None},
                "esperas": {"T1": "B"},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "WAITING (Lock B)", "holding": ["A"], "waiting": "B"},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "HOLDING (Lock B)", "holding": ["B"], "waiting": None},
                },
            },
            {
                "step": 4,
                "title": "Paso 4: T2 Solicita Lock A (¡Ciclo de Coffman!)",
                "os_concept": "Condición 4 de Coffman: Espera Circular (Circular Wait)",
                "description": "T2 solicita Lock A (retenido por T1). Se añade la arista T2 -> A. El ciclo planar A -> T1 -> B -> T2 -> A se cierra. DFS detecta interbloqueo irresoluble.",
                "scenario": "DEADLOCK",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": "T1", "B": "T2", "C": None},
                "esperas": {"T1": "B", "T2": "A"},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "DEADLOCKED", "holding": ["A"], "waiting": "B"},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "DEADLOCKED", "holding": ["B"], "waiting": "A"},
                },
            },
            {
                "step": 5,
                "title": "Paso 5: El Guardián Selecciona a T2 como Víctima",
                "os_concept": "Algoritmo DFS de Detección y Selección de Víctima",
                "description": "El hilo monitor Guardián detecta el ciclo mediante DFS. Aplica la heurística de recuperación y selecciona a T2 como víctima para ruptura cooperativa.",
                "scenario": "DEADLOCK",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": "T1", "B": "T2", "C": None},
                "esperas": {"T1": "B", "T2": "A"},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "DEADLOCKED", "holding": ["A"], "waiting": "B"},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "VÍCTIMA (Señal de Aborto)", "holding": ["B"], "waiting": "A"},
                },
            },
            {
                "step": 6,
                "title": "Paso 6: T2 Cancela y Libera Lock B",
                "os_concept": "Ruptura Cooperativa del Ciclo (No Apropiación Resuelta)",
                "description": "T2 despierta bajo el monitor, aborta su solicitud de A y en su bloque finally libera el Lock B. El ciclo de interbloqueo desaparece del grafo.",
                "scenario": "RECOVERED",
                "accounts": {"A": 1000, "B": 1000, "C": 1000},
                "propietarios": {"A": "T1", "B": None, "C": None},
                "esperas": {"T1": "B"},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "REANUDANDO (Espera B)", "holding": ["A"], "waiting": "B"},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "CANCELLED", "holding": [], "waiting": None},
                },
            },
            {
                "step": 7,
                "title": "Paso 7: T1 Finaliza y Restaura Invariante (S=3000)",
                "os_concept": "Consistencia de Datos y Conservación de Saldo",
                "description": "Con Lock B libre, T1 se desbloquea, toma el Lock B, ejecuta la transferencia de 100u de A a B (A=900, B=1100) y libera ambos recursos. Invariante S=3000 íntegro.",
                "scenario": "RECOVERED",
                "accounts": {"A": 900, "B": 1100, "C": 1000},
                "propietarios": {"A": None, "B": None, "C": None},
                "esperas": {},
                "race_accesses": {},
                "threads_info": {
                    "T1": {"name": "T1", "tid": 101, "role": "WORKER", "status": "COMPLETED", "holding": [], "waiting": None},
                    "T2": {"name": "T2", "tid": 102, "role": "WORKER", "status": "CANCELLED", "holding": [], "waiting": None},
                },
            },
        ]


# Instancia global del motor
engine = TransactionEngine()
engine.start_guardian()
