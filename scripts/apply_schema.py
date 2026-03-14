import os
import requests
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ 错误: 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

# SQL 修复脚本
sql_commands = [
    "ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS importance TEXT;",
    "ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS quality_score FLOAT;",
    "ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;",
    "ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;",
    "ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral';"
]

# Supabase SQL API 终端 (通常需要 service_role key)
# 注意：Supabase 官方 REST API 不直接暴露 SQL 终端，
# 除非使用了类似 pg_graphql 或自定义边缘函数。
# 这里我们尝试通过 RPC 或直接提示用户。

print("⚠️ 正在尝试通过 Supabase 管理接口同步 Schema...")

# 备选方案：通过插入一个包含新字段的空记录来触发（但这通常在 Postgres 中不起作用，除非列已存在）
# 正确做法：由于我们没有直接的 SQL 执行权限（REST API 不支持 DDL），
# 我们需要检查是否有现有的迁移机制或提示用户。

print("\n由于 Supabase REST API 不支持直接执行 DDL (ALTER TABLE)，")
print("请在 Supabase Dashboard 的 SQL Editor 中执行以下语句：\n")
for sql in sql_commands:
    print(sql)

print("\n执行完毕后，重新运行 crawler 即可。")
