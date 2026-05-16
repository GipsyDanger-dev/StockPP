# backend/run_first_train.py
import logging
from core.retraining_orchestrator import RetrainingOrchestrator

# Setup logging agar kita bisa lihat prosesnya di terminal
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def main():
    print("🚀 Memulai Training Model Pertama...")
    
    # Inisialisasi Orchestrator
    # Pastikan folder 'saved_models' sudah ada atau akan dibuat otomatis oleh ModelManager
    orchestrator = RetrainingOrchestrator()
    
    # Pilih ticker (misal: Apple)
    ticker = "AAPL"
    
    # Jalankan training
    # force_retrain=True karena ini model pertama, belum ada pembandingnya
    result = orchestrator.retrain_model(
        ticker=ticker, 
        period="5y",     # Ambil data 5 tahun terakhir untuk akurasi lebih baik
        epochs=10,       # Untuk tes awal 10 saja, nanti bisa 50+
        batch_size=32, 
        force_retrain=True
    )
    
    if result["status"] == "success":
        print(f"✅ Berhasil! Model {ticker} disimpan dengan RMSE: {result['new_metrics']['rmse']:.4f}")
    else:
        print(f"❌ Gagal: {result.get('error', 'Cek log untuk detail')}")

if __name__ == "__main__":
    main()