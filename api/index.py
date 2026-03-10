# api/index.py
# Vercel Serverless Function 入口
# 专门处理情报采集 API

import os
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

# 导入采集模块
from update_intel import update_intelligence
from rss_collector import run_rss_collection

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """处理 GET 请求"""
        path = self.path

        # 路由分发
        if path == '/api/update_intel':
            self._handle_update_intel()
        elif path == '/api/rss_collect':
            self._handle_rss_collect()
        elif path == '/api/health':
            self._handle_health()
        else:
            self._send_json(404, {"error": "Not Found", "path": path})

    def do_POST(self):
        """处理 POST 请求"""
        self._send_json(405, {"error": "Method Not Allowed"})

    def _handle_update_intel(self):
        """处理情报采集"""
        try:
            print(f"[{datetime.now()}] 开始情报采集...")
            stats = update_intelligence()

            self._send_json(200, {
                "status": "success",
                "message": "Intelligence collection completed",
                "stats": stats,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"采集失败: {str(e)}")
            self._send_json(500, {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            })

    def _handle_rss_collect(self):
        """处理 RSS 采集"""
        try:
            print(f"[{datetime.now()}] 开始 RSS 采集...")
            result = run_rss_collection()

            self._send_json(200, {
                "status": "success",
                "message": "RSS collection completed",
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"RSS 采集失败: {str(e)}")
            self._send_json(500, {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            })

    def _handle_health(self):
        """健康检查"""
        self._send_json(200, {
            "status": "healthy",
            "service": "auto-intel-api",
            "timestamp": datetime.now().isoformat(),
            "env": {
                "has_brave_key": bool(os.environ.get("BRAVE_API_KEY")),
                "has_supabase_key": bool(os.environ.get("SUPABASE_SERVICE_ROLE_KEY")),
                "has_gemini_key": bool(os.environ.get("GEMINI_API_KEY"))
            }
        })

    def _send_json(self, status_code, data):
        """发送 JSON 响应"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

# Vercel 入口
def handle_request(request):
    """Vercel Edge Function 兼容入口"""
    from http.server import HTTPServer
    from io import BytesIO

    # 创建临时 handler 处理请求
    class MockRequest:
        def __init__(self, method, path):
            self.command = method
            self.path = path
            self.headers = {}

    # 处理请求
    handler_instance = handler(MockRequest(request.method, request.path), None, None)
    return handler_instance
