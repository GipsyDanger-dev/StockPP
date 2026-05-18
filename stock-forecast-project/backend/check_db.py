import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

def test_supabase_connection():
    print(f"Menggunakan URL: {url}")
    if not key:
        print("❌ Error: SUPABASE_KEY tidak ditemukan di .env")
        return

    try:
        supabase = create_client(url, key)

        response = supabase.table("tickers").select("*").limit(1).execute()
        
        print("✅ KONEKSI SUPABASE BERHASIL!")
        print(f"Jumlah data ticker di DB: {len(response.data)}")
        
    except Exception as e:
        print(f"❌ KONEKSI GAGAL: {str(e)}")

if __name__ == "__main__":
    test_supabase_connection()