#!/bin/bash
# Zeabur 部署脚本
# 使用方法: chmod +x deploy-zeabur.sh && ./deploy-zeabur.sh

API_KEY="sk-3sdd7bdqooxkpi6iqpzll7lxhnggg"
API_URL="https://gateway.zeabur.com/graphql"

# 1. 获取项目列表
echo "📋 获取项目列表..."
PROJECTS=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ projects { _id name } }"}')

echo "$PROJECTS" | jq .

# 2. 获取项目 ID (需要手动替换)
echo ""
echo "请在上面找到 bookvoice 项目的 _id，然后运行："
echo "PROJECT_ID=<你的项目ID> ./deploy-zeabur.sh deploy"

if [ "$1" = "deploy" ]; then
  PROJECT_ID="${PROJECT_ID:-}"

  if [ -z "$PROJECT_ID" ]; then
    echo "❌ 请设置 PROJECT_ID 环境变量"
    exit 1
  fi

  # 3. 获取服务列表
  echo "📦 获取服务列表..."
  SERVICES=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"{ project(_id: \\\"$PROJECT_ID\\\") { services { _id name type status template } } }\"}")

  echo "$SERVICES" | jq .

  echo ""
  echo "✅ 请检查服务状态"
fi
