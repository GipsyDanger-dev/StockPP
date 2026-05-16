import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
print(f"URL: {url}")
if key:
    print(f"Key prefix: {key[:10]}...")
else:
    print("Key is None")
try:
    client = create_client(url, key)
    print("Client created")
    result = client.table("tickers").select("*").limit(1).execute()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")