from core.forecasting_service import ForecastingService
import json

def test():
    print("🔮 Meminta AI untuk memprediksi harga...")
    service = ForecastingService()
    
    # Gunakan predict() sesuai method yang ada di ForecastingService
    result = service.predict("AAPL", days_ahead=7, period="1y")
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"\n--- HASIL PREDIKSI {result['ticker']} ---")
        print(f"Harga Saat Ini: ${result['current_price']}")
        print(f"Sentimen Tren : {result['trend']} ({result.get('change_percent', 0):.2f}%)")
        print(f"Sumber Model  : {result.get('model_source', 'unknown')}")
        print("\n--- PREDIKSI 7 HARI KE DEPAN ---")
        for f in result['forecast']:
            print(f"  {f['date']}: ${f['price']}")
        
        print(f"\nMetrik Akurasi (RMSE): {result['metrics']['rmse']}")
        print(f"Metrik Akurasi (MAE) : {result['metrics']['mae']}")

if __name__ == "__main__":
    test()