from core.retraining_orchestrator import RetrainingOrchestrator
import logging

logging.basicConfig(level=logging.INFO)

def start():
    print("Memulai training pertama untuk AAPL...")
    orch = RetrainingOrchestrator()
    # force_retrain=True karena belum ada model lama
    res = orch.retrain_model("AAPL", period="5y", epochs=10, force_retrain=True)
    print(f"Hasil: {res['status']}")
    if res['status'] == 'success':
        print(f"RMSE: {res['new_metrics']['rmse']}")

if __name__ == "__main__":
    start()