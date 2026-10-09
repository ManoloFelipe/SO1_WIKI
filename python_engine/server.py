"""
Servidor HTTP REST para el Motor de Transacciones Concurrentes.
Usa únicamente la biblioteca estándar de Python (ThreadingHTTPServer).
Compatible con Windows (local), WSL2, Docker y máquinas virtuales Linux en Azure.
"""

import os
import json
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from engine import engine

PORT = int(os.environ.get("ENGINE_PORT", 8000))
HOST = os.environ.get("ENGINE_HOST", "0.0.0.0")

class ConcurrencyApiHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send_json_response(self, data: dict, status_code: int = 200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/", "/api", "/api/status", "/api/snapshot"]:
            snapshot = engine.get_snapshot()
            self._send_json_response({
                "success": True,
                "data": snapshot,
            })
        elif path == "/api/health":
            self._send_json_response({
                "status": "ok",
                "service": "python-concurrency-engine",
                "pid": os.getpid(),
            })
        elif path == "/api/step/status":
            snapshot = engine.get_snapshot()
            self._send_json_response({
                "success": True,
                "data": snapshot.get("step_info", {}),
            })
        else:
            self._send_json_response({"success": False, "error": "Endpoint no encontrado"}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body = {}

        if path == "/api/normal":
            count = int(body.get("count", 4))
            engine.run_normal_batch(count=count)
            self._send_json_response({
                "success": True,
                "message": f"Iniciadas {count} transferencias en modo normal.",
                "data": engine.get_snapshot(),
            })

        elif path == "/api/race-condition":
            protected = bool(body.get("protected", False))
            engine.run_race_condition(protected=protected)
            mode_str = "protegida (con locks)" if protected else "desprotegida (sin locks, con Barrier)"
            self._send_json_response({
                "success": True,
                "message": f"Prueba de carrera {mode_str} iniciada.",
                "data": engine.get_snapshot(),
            })

        elif path == "/api/deadlock":
            engine.run_deadlock()
            self._send_json_response({
                "success": True,
                "message": "Interbloqueo caótico inyectado con Barrier(2) y Coffman.",
                "data": engine.get_snapshot(),
            })

        elif path == "/api/recover":
            result = engine.recover_deadlock()
            self._send_json_response({
                "success": result.get("success", False),
                "message": result.get("message", ""),
                "data": engine.get_snapshot(),
            })

        elif path == "/api/reset":
            engine.reset_state()
            self._send_json_response({
                "success": True,
                "message": "Estado del motor y saldos reiniciados a 1000 c/u.",
                "data": engine.get_snapshot(),
            })

        # =====================================================================
        # SERVICIOS ALEDANOS: PASO A PASO EN EL GRAFO
        # =====================================================================
        elif path == "/api/step/init":
            scenario = str(body.get("scenario", "DEADLOCK"))
            snapshot = engine.init_step_mode(scenario)
            self._send_json_response({
                "success": True,
                "message": f"Modo paso a paso iniciado para escenario {scenario}.",
                "data": snapshot,
            })

        elif path == "/api/step/next":
            snapshot = engine.next_step()
            self._send_json_response({
                "success": True,
                "message": "Avanzado al siguiente paso en el grafo.",
                "data": snapshot,
            })

        elif path == "/api/step/prev":
            snapshot = engine.prev_step()
            self._send_json_response({
                "success": True,
                "message": "Retrocedido al paso anterior en el grafo.",
                "data": snapshot,
            })

        elif path == "/api/step/reset":
            snapshot = engine.reset_step()
            self._send_json_response({
                "success": True,
                "message": "Paso a paso reiniciado al Paso 0.",
                "data": snapshot,
            })

        elif path == "/api/step/exit":
            snapshot = engine.exit_step_mode()
            self._send_json_response({
                "success": True,
                "message": "Modo paso a paso desactivado. Regresando a modo dinámico continuo.",
                "data": snapshot,
            })

        else:
            self._send_json_response({"success": False, "error": "Endpoint POST no encontrado"}, 404)

    def log_message(self, format, *args):
        # Deshabilitar logs por defecto en stdout para no saturar consola
        pass


def run_server():
    server_address = (HOST, PORT)
    httpd = ThreadingHTTPServer(server_address, ConcurrencyApiHandler)
    print(f"============================================================")
    print(f"  MOTOR DE TRANSACCIONES CONCURRENTES (SISTEMAS OPERATIVOS) ")
    print(f"  PID del Proceso: {os.getpid()}")
    print(f"  Servidor activo en: http://localhost:{PORT}")
    print(f"  Rutas disponibles: /api/status, /api/normal, /api/deadlock, etc.")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servidor...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
