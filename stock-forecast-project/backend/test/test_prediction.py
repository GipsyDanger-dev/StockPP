from core.forecasting_service import ForecastingService
import json

def test():
    print("🔮 Meminta AI untuk memprediksi harga...")
    service = ForecastingService()
    
    # Kita panggil ticker AAPL yang sudah kita train tadi
    result = service.get_forecast("AAPL")
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"\n--- HASIL PREDIKSI {result['ticker']} ---")
        print(f"Harga Saat Ini: ${result['current_price']}")
        print(f"Prediksi Besok: ${result['forecast_price']}")
        print(f"Sentimen Tren : {result['trend']}")
        print("\n--- PREDIKSI 7 HARI KE DEPAN ---")
        for f in result['forecast']:
            print(f"{f['date']}: ${f['price']}")
        
        print(f"\nMetrik Akurasi (RMSE): {result['metrics']['rmse']}")

if __name__ == "__main__":
    test()