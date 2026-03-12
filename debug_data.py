
import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_gtc_byd_data():
    print("--- 检查 GTC 2026 相关情报 ---")
    res_gtc = supabase.table("industry_intelligence") \
        .select("*") \
        .or_("title.ilike.%GTC%,category.eq.gtc-insight") \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    if res_gtc.data:
        for item in res_gtc.data:
            print(f"ID: {item['id']} | 标题: {item['title']} | 时间: {item['created_at']}")
    else:
        print("未发现 GTC 相关数据")

    print("\n--- 检查 比亚迪(BYD) 最新情报 ---")
    res_byd = supabase.table("industry_intelligence") \
        .select("*") \
        .or_("title.ilike.%比亚迪%,title.ilike.%BYD%") \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    if res_byd.data:
        for item in res_byd.data:
            print(f"ID: {item['id']} | 标题: {item['title']} | 时间: {item['created_at']}")
    else:
        print("未发现比亚迪相关数据")

if __name__ == "__main__":
    check_gtc_byd_data()
