#!/bin/bash

# Login and get token
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' | jq -r '.data.tokens.accessToken')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test searches
echo "🔍 Test 1: Empty search (should return all projects)"
curl -s -X GET "http://localhost:3001/api/v1/projects" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {total: .pagination.total, projects: [.data[].name]}'

echo ""
echo "🔍 Test 2: Search for '新機能' (should return 1 project)"
curl -s -X GET "http://localhost:3001/api/v1/projects?search=新機能" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {total: .pagination.total, projects: [.data[].name]}'

echo ""
echo "🔍 Test 3: Search for 'プロジェクト' (should return 2 projects)"
curl -s -X GET "http://localhost:3001/api/v1/projects?search=プロジェクト" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {total: .pagination.total, projects: [.data[].name]}'

echo ""
echo "🔍 Test 4: Search for '存在しない' (should return 0 projects)"
curl -s -X GET "http://localhost:3001/api/v1/projects?search=存在しない" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {total: .pagination.total, projects: [.data[].name]}'