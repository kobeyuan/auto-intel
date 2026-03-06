# api/update_intel.py
import os
import requests
from dotenv import load_dotenv  # 新增这一行
from supabase import create_client, Client
from http.server import BaseHTTPRequestHandler


# 强制加载项目根目录下的 .env 文件
load_dotenv()

# 配置环境变量 (在 Vercel Dashboard 中设置)
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # 使用 service_role 以拥有写权限
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_and_save(query, category):
    headers = {"X-Subscription-Token": BRAVE_API_KEY, "Accept": "application/json"}
    # 针对 2026 年行业趋势的搜索参数
    params = {"q": query, "count": 10, "search_lang": "zh-hans"} 
    
    response = requests.get("https://api.search.brave.com/res/v1/web/search", headers=headers, params=params)
    results = response.json().get("web", {}).get("results", [])

    items_to_insert = []
    for res in results:
        items_to_insert.append({
            "title": res.get("title"),
            "link": res.get("url"),
            "snippet": res.get("description"),
            "source": res.get("meta_url", {}).get("hostname", "Unknown"),
            "category": category
        })

    # 批量插入数据，upsert 会根据 link (唯一索引) 自动去重
    if items_to_insert:
        supabase.table("industry_intelligence").upsert(items_to_insert, on_conflict="link").execute()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 抓取两个核心模块的情报
        fetch_and_save("2026 智能座舱 行业趋势 比亚迪 华为", "smart-cockpit")
        fetch_and_save("2026 智能驾驶 L3 L4 智驾 行业资讯", "autonomous-driving")
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write('{"status": "success", "message": "Intelligence updated"}'.encode())
        
        
        
        
if __name__ == '__main__':
    fetch_and_save("2026 智能座舱 行业趋势 比亚迪 华为", "smart-cockpit")
    fetch_and_save("2026 智能驾驶 L3 L4 智驾 行业资讯", "autonomous-driving")
    
    # 🔥 新增的三个板块
    fetch_and_save("2026 自动驾驶 激光雷达 毫米波雷达 视觉传感器", "sensors")
    fetch_and_save("2026 新能源汽车 OTA 升级 固件更新", "ota")
    fetch_and_save("比亚迪 华为 智驾 真实评价 吐槽 舆情", "sentiment")
    
    print("抓取并写入完成！请去 Supabase 查看。")
