Stock Price Forecasting Agent Guide (Industrial Standards) - V5 (Final Full-Stack)
1. Project Overview
Sistem prediksi harga saham berbasis Deep Learning (LSTM) dengan arsitektur Full-Stack modern yang memisahkan antara Engine Analisis dan Interface Pengguna. Sistem ini dirancang untuk kebutuhan analisis industrial yang menuntut akurasi, skalabilitas, dan interpretabilitas data.

2. Project Scope & Architecture
Backend (FastAPI - Analytics Engine):
Core Responsibility: Mengolah data berat menggunakan library Scikit-learn dan TensorFlow/Keras serta menyediakannya lewat API JSON.

Data Ingestion: Mengambil data historis yang stabil melalui library yfinance.

Processing: Melakukan pembersihan data, normalisasi menggunakan MinMaxScaler, dan pembuatan data sequence (windowing 60 hari).

Inference: Menjalankan model LSTM untuk menghasilkan prediksi harga masa depan.

Frontend (React - Interactive Interface):
Core Responsibility: Memvisualisasikan data dari API secara interaktif dan menangani seluruh interaksi user secara responsif.

Visualization: Merender grafik harga (menggunakan Lightweight Charts atau Recharts) yang mencakup data aktual dan forecast.

User Experience: Menangani fitur pemilihan ticker saham, filter rentang waktu, dan fitur download laporan.

3. Recommended Project Structure (Acuan Agent)
Agent harus mengikuti struktur folder berikut untuk menjaga organisasi kode yang profesional:

Plaintext
stock-forecast-project/
├── backend/                # FastAPI Application
│   ├── main.py             # Entry point API & Routing
│   ├── core/               # Logika utama (LSTM model, Preprocessing)
│   │   ├── model.py        # Arsitektur & Training TensorFlow/Keras
│   │   └── data_engine.py  # Library yfinance & pandas logic
│   ├── api/                # Route definitions & Controllers
│   ├── saved_models/       # Penyimpanan file .h5 atau .keras
│   └── requirements.txt    # Dependency Python (fastapi, tensorflow, yfinance, etc.)
├── frontend/               # React Application (Vite)
│   ├── src/
│   │   ├── components/     # UI Components (PriceChart, MetricsCard, Sidebar)
│   │   ├── hooks/          # Custom hooks (TanStack Query logic)
│   │   ├── services/       # API calling (Axios instance to Backend)
│   │   └── App.jsx         # Main Layout & Dashboard Entry
│   ├── tailwind.config.js  # Styling configuration
│   └── package.json        # Dependency Node.js (react, recharts, axios)
└── README.md               # Dokumentasi Proyek
4. Core Technical Stack
Backend: Python 3.x, FastAPI, TensorFlow, Scikit-learn, Pandas, Uvicorn.

Frontend: React.js (Vite), Tailwind CSS, Shadcn/UI, Lightweight Charts (TradingView) atau Recharts, TanStack Query (React Query).

5. Web Dashboard Implementation Standards
Visual Hierarchy: Header (Ticker & Engine Status), KPI Cards (Latest Price, RMSE, Confidence Level), Main Chart Area (Interactive Trend), Sidebar (Control Panel).

Industrial Styling: Menggunakan tema profesional (Clean White atau Slate Dark Mode). Pastikan grafik memiliki legenda yang jelas antara data historis dan hasil forecasting.

6. Agent Rules & Logic
A. Data Flow Logic
Request: React mengirim request Ticker (misal: "AAPL") ke endpoint FastAPI.

Processing: FastAPI menjalankan data_engine.py untuk fetching data dan scaling.

Inference: model.py memproses data sequence melalui model LSTM yang sudah di-load.

Response: Output JSON dikirim kembali ke React dengan struktur: { "historical": [...], "forecast": [...], "metrics": {...} }.

Rendering: React merender data ke dalam komponen <PriceChart /> secara dinamis.

B. Professional Forecasting Standard
Evaluasi: Wajib menampilkan metrik RMSE (Root Mean Square Error) dan MAE sebagai indikator akurasi model.

Ekspor Data: Sediakan fungsi untuk mengunduh hasil forecast ke dalam format .csv yang berisi kolom Date dan Predicted_Price.

Penjelasan: Berikan narasi singkat (Auto-generated) tentang apakah tren menunjukkan Bullish atau Bearish.

7. Boundaries (Batasan)
Scope: Prediksi terbatas pada Closing Price harian.

Real-time: Data memiliki delay sesuai dengan penyedia API (yfinance).

Disclaimer: Wajib menyertakan banner atau teks di footer: "Disclaimer: This tool is for technical analysis purposes only and does not constitute financial advice."