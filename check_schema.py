
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_table(table_name):
    print(f"\nChecking table: {table_name}")
    try:
        # Try to get one row to see columns
        res = supabase.table(table_name).select("*").limit(1).execute()
        if res.data:
            print(f"Columns in {table_name}: {list(res.data[0].keys())}")
        else:
            print(f"Table {table_name} is empty or has no data, trying to get schema via RPC or just catching error.")
            # If empty, we might not see columns this way.
            # But usually if it fails, it means table doesn't exist.
            print("Table exists but is empty.")
    except Exception as e:
        print(f"Error checking {table_name}: {e}")

check_table("industry_intelligence")
check_table("industry_news")
check_table("sentiments")
