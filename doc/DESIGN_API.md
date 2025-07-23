# API設計書 - CCPM システム

## 1. API設計概要

### 1.1 設計方針
- **RESTful API**: REST原則に基づく設計
- **JSON形式**: リクエスト・レスポンスはJSON形式
- **ステートレス**: セッション状態を持たない設計
- **バージョニング**: URLパスでのバージョン管理（/api/v1/）
- **HTTPS必須**: 本番環境では暗号化通信

### 1.2 ベースURL
```
開発環境: http://localhost:3000/api/v1
本番環境: https://ccpm.example.com/api/v1
```

### 1.3 認証方式
- **JWT (JSON Web Token)**: Bearer認証
- **リフレッシュトークン**: 長期認証用
- **トークン有効期限**: アクセストークン15分、リフレッシュトークン7日

## 2. 認証API

### 2.1 ログイン
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "user_id": "user123",
  "password": "password123"
}
```

**レスポンス（成功）:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "dGVzdC1yZWZyZXNoLXRva2Vu...",
    "expires_in": 900,
    "token_type": "Bearer",
    "user": {
      "id": "uuid-user-id",
      "user_id": "user123",
      "first_name": "太郎",
      "last_name": "田中",
      "email": "tanaka@example.com",
      "role": "USER",
      "language": "ja"
    }
  }
}
```

### 2.2 ログアウト
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}
```

### 2.3 トークンリフレッシュ
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "dGVzdC1yZWZyZXNoLXRva2Vu..."
}
```

## 3. ユーザー管理API

### 3.1 ユーザー一覧取得
```http
GET /api/v1/users?page=1&limit=20&role=USER&active=true
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-user-id",
        "user_id": "user123",
        "first_name": "太郎",
        "last_name": "田中",
        "email": "tanaka@example.com",
        "role": "USER",
        "is_active": true,
        "last_login_at": "2025-01-22T10:30:00Z",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 3.2 ユーザー詳細取得
```http
GET /api/v1/users/{user_id}
Authorization: Bearer {access_token}
```

### 3.3 ユーザー作成
```http
POST /api/v1/users
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "user_id": "newuser123",
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "次郎",
  "last_name": "山田",
  "role": "USER",
  "language": "ja"
}
```

## 4. プロジェクト管理API

### 4.1 プロジェクト一覧取得
```http
GET /api/v1/projects?page=1&limit=20&status=ACTIVE&owner_id={user_id}
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid-project-id",
        "name": "Project Alpha",
        "description": "CCPMシステム開発プロジェクト",
        "start_date": "2025-01-01",
        "end_date": "2025-06-30",
        "status": "ACTIVE",
        "owner_id": "uuid-user-id",
        "organization_id": "uuid-org-id",
        "progress_rate": 80.5,
        "buffer_consumption": 70.2,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

### 4.2 プロジェクト詳細取得
```http
GET /api/v1/projects/{project_id}
Authorization: Bearer {access_token}
```

### 4.3 プロジェクト作成
```http
POST /api/v1/projects
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "New Project",
  "description": "プロジェクトの説明",
  "start_date": "2025-02-01",
  "end_date": "2025-08-31",
  "organization_id": "uuid-org-id"
}
```

## 5. タスク管理API

### 5.1 タスク一覧取得
```http
GET /api/v1/projects/{project_id}/tasks?status=TODO&assignee_id={user_id}
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid-task-id",
        "project_id": "uuid-project-id",
        "name": "画面設計レビュー",
        "description": "UIデザインのレビューを実施",
        "estimated_hours": 8.0,
        "actual_hours": 2.5,
        "start_date": "2025-01-22",
        "end_date": "2025-01-25",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "assignee_id": "uuid-user-id",
        "progress_rate": 30.0,
        "dependencies": [
          {
            "predecessor_id": "uuid-task-2",
            "dependency_type": "FS",
            "lag_days": 0
          }
        ],
        "created_at": "2025-01-20T00:00:00Z"
      }
    ]
  }
}
```

### 5.2 タスク作成
```http
POST /api/v1/projects/{project_id}/tasks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "新しいタスク",
  "description": "タスクの詳細説明",
  "estimated_hours": 16.0,
  "start_date": "2025-01-23",
  "end_date": "2025-01-30",
  "priority": "MEDIUM",
  "assignee_id": "uuid-user-id"
}
```

### 5.3 タスク依存関係設定
```http
POST /api/v1/tasks/{task_id}/dependencies
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "predecessor_id": "uuid-predecessor-task",
  "dependency_type": "FS",
  "lag_days": 1
}
```

## 6. CCPM分析API

### 6.1 クリティカルチェーン計算
```http
POST /api/v1/projects/{project_id}/critical-chain/calculate
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "critical_chain": {
      "id": "uuid-chain-id",
      "project_id": "uuid-project-id",
      "task_sequence": [
        "uuid-task-1",
        "uuid-task-2",
        "uuid-task-3"
      ],
      "total_duration": 120.5,
      "is_current": true,
      "calculated_at": "2025-01-22T10:30:00Z"
    },
    "buffers": [
      {
        "type": "PROJECT",
        "size_hours": 24.0,
        "consumed_hours": 16.8,
        "consumption_rate": 70.0,
        "position": 1
      },
      {
        "type": "FEEDING",
        "size_hours": 8.0,
        "consumed_hours": 3.2,
        "consumption_rate": 40.0,
        "position": 2
      }
    ]
  }
}
```

### 6.2 バッファ状況取得
```http
GET /api/v1/projects/{project_id}/buffers
Authorization: Bearer {access_token}
```

### 6.3 フィーバーチャートデータ取得
```http
GET /api/v1/projects/{project_id}/fever-chart
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "current_status": {
      "progress_rate": 75.0,
      "buffer_consumption": 80.5,
      "zone": "YELLOW",
      "risk_level": "MEDIUM"
    },
    "trend_data": [
      {
        "date": "2025-01-15",
        "progress_rate": 20.0,
        "buffer_consumption": 10.0
      },
      {
        "date": "2025-01-22",
        "progress_rate": 75.0,
        "buffer_consumption": 80.5
      }
    ]
  }
}
```

## 7. レポートAPI

### 7.1 プロジェクト状況レポート
```http
GET /api/v1/projects/{project_id}/reports/status?format=json
Authorization: Bearer {access_token}
```

### 7.2 リソース使用状況レポート
```http
GET /api/v1/projects/{project_id}/reports/resources?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer {access_token}
```

## 8. 多言語化API

### 8.1 翻訳データ取得
```http
GET /api/v1/i18n/{language_code}
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "language": "ja",
    "translations": {
      "common.save": "保存",
      "common.cancel": "キャンセル",
      "project.title": "プロジェクト",
      "task.status.todo": "未着手",
      "task.status.in_progress": "進行中"
    }
  }
}
```

## 9. エラーレスポンス

### 9.1 エラー形式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データに誤りがあります",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### 9.2 HTTPステータスコード
- **200**: OK - 成功
- **201**: Created - リソース作成成功
- **400**: Bad Request - リクエストエラー
- **401**: Unauthorized - 認証エラー
- **403**: Forbidden - 権限エラー
- **404**: Not Found - リソース未存在
- **409**: Conflict - 競合エラー
- **422**: Unprocessable Entity - バリデーションエラー
- **500**: Internal Server Error - サーバーエラー

### 9.3 エラーコード一覧
- **AUTH_001**: 認証失敗
- **AUTH_002**: トークン期限切れ
- **AUTH_003**: 権限不足
- **VALIDATION_001**: 必須項目未入力
- **VALIDATION_002**: 形式エラー
- **BUSINESS_001**: ビジネスルール違反
- **SYSTEM_001**: システムエラー

## 10. レート制限

### 10.1 制限設定
- **認証API**: 10回/分
- **一般API**: 1000回/時
- **重い処理**: 10回/分

### 10.2 レート制限ヘッダー
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642867200
```

## 11. ページネーション

### 11.1 クエリパラメータ
- **page**: ページ番号（1から開始）
- **limit**: 1ページあたりの件数（最大100）
- **sort**: ソートフィールド
- **order**: ソート順（asc/desc）

### 11.2 レスポンス形式
```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## 12. WebSocket API

### 12.1 リアルタイム通知
```javascript
// 接続
const ws = new WebSocket('ws://localhost:3000/ws');
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'jwt-token'
}));

// プロジェクト進捗購読
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'project_progress',
  project_id: 'uuid-project-id'
}));
```

### 12.2 通知タイプ
- **task_updated**: タスク更新通知
- **buffer_warning**: バッファ警告
- **project_milestone**: マイルストーン達成
- **user_activity**: ユーザーアクティビティ

## 更新履歴

| 日付 | 版数 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2025-01-22 | 1.0 | 初版作成 | - |