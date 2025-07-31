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

PROJECT_ID="cmdpyk9pr00019vqhrg8ioluv"

# Test 1: Get tasks by project
echo "📋 Test 1: Get tasks by project"
curl -s -X GET "http://localhost:3001/api/v1/tasks/project/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.success, .data'

echo ""
# Test 2: Create a new task
echo "➕ Test 2: Create a new task"
TASK_DATA='{
  "title": "テストタスク1",
  "description": "タスク管理APIのテスト用タスク",
  "status": "NOT_STARTED",
  "priority": "MEDIUM",
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "estimatedHours": 40,
  "bufferRatio": 0.3
}'

TASK_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/v1/tasks/project/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TASK_DATA")

echo "$TASK_RESPONSE" | jq '.success, .message'

# Extract task ID if created successfully
TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.data.id // empty')

if [ -n "$TASK_ID" ]; then
  echo "✅ Task created with ID: $TASK_ID"
  
  echo ""
  # Test 3: Get task by ID
  echo "🔍 Test 3: Get task by ID"
  curl -s -X GET "http://localhost:3001/api/v1/tasks/$TASK_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.success, .data.title'
  
  echo ""
  # Test 4: Update task status
  echo "📝 Test 4: Update task status"
  curl -s -X PATCH "http://localhost:3001/api/v1/tasks/$TASK_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "IN_PROGRESS"}' | jq '.success, .message'
  
  echo ""
  # Test 5: Delete task
  echo "🗑️ Test 5: Delete task"
  curl -s -X DELETE "http://localhost:3001/api/v1/tasks/$TASK_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.success, .message'
else
  echo "❌ Task creation failed"
fi