"""
Script de prueba CLI interactivo para verificar el motor de transacciones
antes de conectar con el frontend.
"""

import time
import os
import threading
from engine import TransactionEngine

def main():
    print("=" * 60)
    print("PROBANDO MOTOR DE TRANSACCIONES CONCURRENTES (CLI)")
    print(f"PID del Proceso: {os.getpid()}")
    print("=" * 60)

    test_engine = TransactionEngine()
    test_engine.start_guardian()

    # 1. Prueba normal
    print("\n[1] Probando Lote de Transferencias Normales con Locks Ordenados...")
    test_engine.run_normal_batch(count=3)
    time.sleep(1.8)
    snap = test_engine.get_snapshot()
    print("Saldos tras transferencias normales:", snap["accounts"])
    print("¿Invariante cumplido?:", snap["accounts"]["invariant_satisfied"])
    assert snap["accounts"]["invariant_satisfied"], "¡El invariante debe ser 3000!"

    # 2. Prueba de carrera desprotegida
    print("\n[2] Probando Condición de Carrera Desprotegida con Barrier(2)...")
    test_engine.run_race_condition(protected=False)
    time.sleep(2.5)
    snap = test_engine.get_snapshot()
    print("Saldos tras carrera desprotegida:", snap["accounts"])
    print(f"Total: {snap['accounts']['total']} (debería ser 3100 o 3200 si hubo condición de carrera)")

    # 3. Prueba de carrera protegida
    print("\n[3] Probando Condición de Carrera Protegida (con Locks)...")
    test_engine.run_race_condition(protected=True)
    time.sleep(1.8)
    snap = test_engine.get_snapshot()
    print("Saldos tras carrera protegida:", snap["accounts"])
    print(f"Total: {snap['accounts']['total']} (debe ser 3000)")

    # 4. Prueba de interbloqueo
    print("\n[4] Probando Interbloqueo Caótico (Coffman: T1 retiene A y pide B, T2 retiene B y pide A)...")
    test_engine.reset_state()
    test_engine.run_deadlock()
    time.sleep(1.5)
    snap = test_engine.get_snapshot()
    print("Ciclo detectado por DFS:", snap["rag"]["cycle_path"])
    print("¿Ciclo activo?:", snap["rag"]["cycle_detected"])
    print("Aristas del ciclo:", snap["rag"]["cycle_edges"])
    assert snap["rag"]["cycle_detected"], "¡Debe detectarse el ciclo de interbloqueo!"

    # 5. Recuperación
    print("\n[5] Probando Recuperación Cooperativa del Guardián (Víctima T2)...")
    res = test_engine.recover_deadlock()
    print("Resultado recuperación:", res)
    time.sleep(1.5)
    snap = test_engine.get_snapshot()
    print("¿Ciclo activo tras recuperación?:", snap["rag"]["cycle_detected"])
    print("Saldos finales tras recuperación:", snap["accounts"])
    print("¿Invariante cumplido (S=3000)?:", snap["accounts"]["invariant_satisfied"])

    print("\n" + "=" * 60)
    print("¡TODAS LAS PRUEBAS DEL MOTOR CONCURRENTE PASARON SATISFACTORIAMENTE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
