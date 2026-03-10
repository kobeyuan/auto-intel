#!/usr/bin/env python3
"""
Brave Search API 深度诊断工具
分析连接问题并提供解决方案
"""

import os
import socket
import ssl
import sys
import time
from datetime import datetime

try:
    import requests
    from urllib3.util.retry import Retry
    from requests.adapters import HTTPAdapter
except ImportError:
    print("缺少依赖: pip install requests urllib3")
    sys.exit(1)

# 配置
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY", "")
BRAVE_API_HOST = "api.search.brave.com"
BRAVE_API_PORT = 443

print("=" * 70)
print("🔍 Brave Search API 深度诊断")
print("=" * 70)
print(f"诊断时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"目标主机: {BRAVE_API_HOST}:{BRAVE_API_PORT}")
print(f"API Key: {'✓ 已配置' if BRAVE_API_KEY else '✗ 未配置'}")

# 1. DNS 解析测试
print("\n1️⃣ DNS 解析测试")
print("-" * 50)
try:
    ip_addresses = socket.getaddrinfo(BRAVE_API_HOST, None, socket.AF_INET)
    ipv4_list = [addr[4][0] for addr in ip_addresses]
    print(f"✓ DNS 解析成功")
    print(f"  IPv4 地址: {', '.join(set(ipv4_list))}")
except Exception as e:
    print(f"✗ DNS 解析失败: {str(e)}")

# 2. TCP 连接测试
print("\n2️⃣ TCP 连接测试")
print("-" * 50)
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    result = sock.connect_ex((BRAVE_API_HOST, BRAVE_API_PORT))
    if result == 0:
        print(f"✓ TCP 连接成功 (端口 {BRAVE_API_PORT} 开放)")
    else:
        print(f"✗ TCP 连接失败 (错误码: {result})")
    sock.close()
except Exception as e:
    print(f"✗ TCP 连接异常: {str(e)}")

# 3. SSL/TLS 握手测试
print("\n3️⃣ SSL/TLS 握手测试")
print("-" * 50)
try:
    context = ssl.create_default_context()
    with socket.create_connection((BRAVE_API_HOST, BRAVE_API_PORT), timeout=10) as sock:
        with context.wrap_socket(sock, server_hostname=BRAVE_API_HOST) as ssock:
            cipher = ssock.cipher()
            version = ssock.version()
            print(f"✓ SSL 握手成功")
            print(f"  协议版本: {version}")
            print(f"  加密套件: {cipher[0]}")
except ssl.SSLError as e:
    print(f"✗ SSL 错误: {str(e)}")
    print(f"  可能原因: 证书问题、中间人攻击、TLS 版本不兼容")
except socket.timeout:
    print(f"✗ SSL 握手超时")
    print(f"  可能原因: 网络延迟、防火墙拦截、连接被重置")
except Exception as e:
    print(f"✗ SSL 异常: {str(e)}")

# 4. HTTP 请求测试（不同方式）
print("\n4️⃣ HTTP 请求测试")
print("-" * 50)

# 4.1 标准请求
print("\n方式 A: 标准 requests 请求")
try:
    headers = {
        "X-Subscription-Token": BRAVE_API_KEY,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0"
    }
    response = requests.get(
        f"https://{BRAVE_API_HOST}/res/v1/web/search",
        headers=headers,
        params={"q": "test", "count": 1},
        timeout=15,
        verify=True
    )
    print(f"  状态码: {response.status_code}")
    if response.status_code == 200:
        print(f"  ✓ 请求成功")
    elif response.status_code == 401:
        print(f"  ✗ API Key 无效")
    else:
        print(f"  响应: {response.text[:100]}")
except requests.exceptions.SSLError as e:
    print(f"  ✗ SSL 错误: {str(e)[:80]}")
except requests.exceptions.Timeout:
    print(f"  ✗ 请求超时")
except Exception as e:
    print(f"  ✗ 错误: {str(e)[:80]}")

# 4.2 禁用 SSL 验证（仅测试）
print("\n方式 B: 禁用 SSL 验证（仅用于诊断）")
try:
    response = requests.get(
        f"https://{BRAVE_API_HOST}/res/v1/web/search",
        headers={"X-Subscription-Token": BRAVE_API_KEY},
        params={"q": "test", "count": 1},
        timeout=15,
        verify=False
    )
    print(f"  状态码: {response.status_code}")
    if response.status_code == 200:
        print(f"  ✓ 请求成功 (SSL 验证已禁用)")
    else:
        print(f"  响应: {response.text[:100]}")
except Exception as e:
    print(f"  ✗ 错误: {str(e)[:80]}")

# 4.3 使用适配器重试
print("\n方式 C: 使用重试适配器")
try:
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('https://', adapter)

    response = session.get(
        f"https://{BRAVE_API_HOST}/res/v1/web/search",
        headers={"X-Subscription-Token": BRAVE_API_KEY},
        params={"q": "test", "count": 1},
        timeout=20
    )
    print(f"  状态码: {response.status_code}")
    if response.status_code == 200:
        print(f"  ✓ 请求成功")
except Exception as e:
    print(f"  ✗ 错误: {str(e)[:80]}")

# 5. 代理检测
print("\n5️⃣ 代理检测")
print("-" * 50)
env_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY']
proxy_found = False
for var in env_vars:
    value = os.environ.get(var)
    if value:
        print(f"  {var}: {value}")
        proxy_found = True
if not proxy_found:
    print("  未检测到代理设置")

# 6. 网络路由测试
print("\n6️⃣ 网络路由测试 (traceroute)")
print("-" * 50)
try:
    import subprocess
    result = subprocess.run(
        ['traceroute', '-m', '10', BRAVE_API_HOST],
        capture_output=True,
        text=True,
        timeout=30
    )
    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')[:5]
        print("  路由路径 (前5跳):")
        for line in lines:
            print(f"    {line}")
    else:
        print(f"  traceroute 失败: {result.stderr[:100]}")
except Exception as e:
    print(f"  无法执行 traceroute: {str(e)}")

# 7. 解决方案建议
print("\n" + "=" * 70)
print("💡 问题分析与解决方案")
print("=" * 70)

print("""
基于诊断结果，Brave API 连接问题的可能原因和解决方案：

【原因分析】
1. SSL/TLS 握手超时
   - 移动网络可能存在防火墙或流量整形
   - 某些网络提供商可能限制对国外 API 的访问
   - 证书链验证问题

2. 网络延迟高
   - 移动网络到 Brave 服务器的路由较长
   - 国际出口带宽限制

【解决方案】

方案 A: 使用代理 (推荐)
```bash
export HTTPS_PROXY="http://your-proxy:port"
python api/update_intel.py
```

方案 B: 更换网络环境
- 使用企业宽带或固定 IP 网络
- 部署到 Vercel/Cloudflare (海外网络)

方案 C: 更换搜索 API
考虑使用以下替代方案：
- SerpAPI (Google Search)
- Bing Search API
- Google Custom Search JSON API

方案 D: 修改代码增加重试和超时
在 api/update_intel.py 中：
- 增加更长的超时时间
- 添加代理支持
- 实现指数退避重试

【立即修复】
如需在本地立即使用，可以修改 api/update_intel.py 添加代理支持：
```python
proxies = {
    'https': 'http://your-proxy:port'
}
response = requests.get(..., proxies=proxies)
```
""")

print("\n诊断完成！")
