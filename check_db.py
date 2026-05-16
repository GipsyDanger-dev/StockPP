import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
load_dotenv() 

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(url, key)

print('--- Checking Tables ---')
try:
    # Attempt to list tables by querying information_schema
    res = supabase.rpc('get_tables', {}).execute()
    print('Tables:', res.data)
except Exception as e:
    print('Error listing tables via RPC:', e)
    # Fallback: check specific tables
    for table in ['tickers', 'training_logs']:
        try:
            res = supabase.table(table).select("*").limit(1).execute()
            print(f'Table "{table}" exists.')
        except Exception as e2:
            print(f'Table "{table}" error or not found: {e2}')

print('\n--- Checking Buckets ---')
try:
    buckets = supabase.storage.list_buckets()
    print('Buckets:', [b.name for b in buckets])
except Exception as e:
    print('Error checking buckets:', e)
