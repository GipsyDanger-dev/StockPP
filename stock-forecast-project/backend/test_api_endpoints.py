"""Test all API endpoints"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api/v1"

def test_endpoint(name, method, url, **kwargs):
    print(f"\n{'='*50}")
    print(f"🧪 Testing: {name}")
    print(f"   {method.upper()} {url}")
    print(f"{'='*50}")
    try:
        if method == "get":
            r = requests.get(url, timeout=10, **kwargs)
        else:
            r = requests.post(url, timeout=10, **kwargs)
        print(f"   Status: {r.status_code}")
        if r.status_code < 400:
            data = r.json()
            if isinstance(data, dict):
                print(f"   Keys: {list(data.keys())}")
            print(f"   Response (truncated): {json.dumps(data, indent=2)[:500]}")
        else:
            print(f"   Error: {r.text[:500]}")
        return r.status_code < 400
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False

print("="*60)
print("🔍 API ENDPOINT TESTING")
print("="*60)

# 1. Health
test_endpoint("Health Check", "get", f"{BASE_URL}/health")

# 2. Root
test_endpoint("Root", "get", f"{BASE_URL}/")

# 3. Validate Ticker
test_endpoint("Validate AAPL", "get", f"{API_URL}/validate/AAPL")

# 4. Validate Invalid Ticker
test_endpoint("Validate INVALID", "get", f"{API_URL}/validate/INVALIDXYZ")

# 5. Forecast POST (AAPL - already trained)
test_endpoint("Forecast AAPL", "post", f"{API_URL}/forecast", 
              json={"ticker": "AAPL", "days_ahead": 3, "period": "1y"})

# 6. Forecast POST (TSLA - NOT trained, should auto-train)
# This will take time (70 epochs) - skip for quick test
# test_endpoint("Forecast TSLA (auto-train)", "post", f"{API_URL}/forecast", 
#               json={"ticker": "TSLA", "days_ahead": 3, "period": "1y"})

# 7. Historical
test_endpoint("Historical AAPL", "get", f"{API_URL}/historical/AAPL?days=30")

# 8. Metrics
test_endpoint("Metrics AAPL", "get", f"{API_URL}/metrics/AAPL")

# 9. Retrain Status
test_endpoint("Retrain Status AAPL", "get", f"{API_URL}/retrain/status/AAPL")

# 10. Models Status
test_endpoint("All Models Status", "get", f"{API_URL}/models/status")

# 11. Health Database
test_endpoint("Database Health", "get", f"{API_URL}/health/database")

# 12. Market Summary
test_endpoint("Market Summary", "get", f"{API_URL}/market/summary")

# 13. Reports History
test_endpoint("Reports History", "get", f"{API_URL}/reports/history")

print("\n" + "="*60)
print("🏁 TESTING COMPLETE")
print("="*60)