from core.forecasting_service import ForecastingService

def run_test():
    service = ForecastingService()
    print("🤖 Meminta AI memprediksi AAPL...")
    res = service.predict("AAPL")
    
    print(f"\nTicker: {res['ticker']}")
    print(f"Harga Sekarang: ${res['current_price']}")
    print(f"Trend: {res['trend']} ({res['change_percent']}%)")
    print("\nRamalan 5 Hari ke Depan:")
    for f in res['forecast']:
        print(f"{f['date']}: ${f['price']}")

if __name__ == "__main__":
    run_test()