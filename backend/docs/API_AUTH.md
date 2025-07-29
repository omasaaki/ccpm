# 認証・認可 API 仕様書

## 概要

CCPMシステムの認証・認可機能に関するAPI仕様書です。

## 認証方式

- **JWT (JSON Web Token)** を使用したトークンベース認証
- アクセストークン（有効期限: 24時間）とリフレッシュトークン（有効期限: 7日）の2種類を使用
- Authorization ヘッダーに `Bearer {token}` 形式で指定

## ロールベースアクセス制御 (RBAC)

### ユーザーロール

| ロール | 説明 | 権限レベル |
|--------|------|------------|
| ADMIN | システム管理者 | 全機能へのアクセス権 |
| MANAGER | プロジェクトマネージャー | プロジェクト管理、ユーザー閲覧権限 |
| USER | 一般ユーザー | 自身のデータへのアクセス権のみ |

## エンドポイント一覧

### 認証エンドポイント

#### 1. ユーザー登録
```
POST /api/v1/auth/register
```

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "name": "Full Name",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "name": "Full Name",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  },
  "message": "User registered successfully"
}
```

**注意事項:**
- メール認証が必要（開発環境では自動的に認証済みとなる）
- パスワードは最低6文字以上

#### 2. ログイン
```
POST /api/v1/auth/login
```

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "name": "Full Name",
      "role": "USER",
      "isActive": true,
      "emailVerified": true,
      "failedLoginAttempts": 0,
      "lockoutUntil": null,
      "lastLoginAt": "2025-07-29T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  },
  "message": "Login successful"
}
```

**エラーレスポンス:**
- 401: メールアドレスまたはパスワードが無効
- 401: アカウントがロックされている
- 401: メール未認証
- 401: アカウントが無効化されている

#### 3. プロフィール取得（要認証）
```
GET /api/v1/auth/profile
```

**ヘッダー:**
```
Authorization: Bearer {access_token}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "name": "Full Name",
    "role": "USER",
    "isActive": true,
    "createdAt": "2025-07-29T00:00:00.000Z",
    "updatedAt": "2025-07-29T00:00:00.000Z"
  }
}
```

#### 4. トークンリフレッシュ
```
POST /api/v1/auth/refresh
```

**リクエストボディ:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  },
  "message": "Tokens refreshed successfully"
}
```

#### 5. ログアウト（要認証）
```
POST /api/v1/auth/logout
```

**ヘッダー:**
```
Authorization: Bearer {access_token}
```

**リクエストボディ（オプション）:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 6. パスワードリセット要求
```
POST /api/v1/auth/password-reset/request
```

**リクエストボディ:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

#### 7. パスワードリセット実行
```
POST /api/v1/auth/password-reset/confirm
```

**リクエストボディ:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### 8. メールアドレス確認
```
POST /api/v1/auth/email/verify
```

**リクエストボディ:**
```json
{
  "token": "verification_token"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 9. 確認メール再送信
```
POST /api/v1/auth/email/resend-verification
```

**リクエストボディ:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### ユーザー管理エンドポイント（要認証）

#### 1. ユーザー一覧取得（Admin/Manager専用）
```
GET /api/v1/users?page=1&limit=10&search=keyword&role=USER&isActive=true
```

**ヘッダー:**
```
Authorization: Bearer {access_token}
```

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10）
- `search`: 検索キーワード（メール、ユーザー名、名前で検索）
- `role`: ロールフィルター（ADMIN, MANAGER, USER）
- `isActive`: アクティブ状態フィルター（true/false）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "name": "Full Name",
        "role": "USER",
        "isActive": true,
        "emailVerified": true,
        "lastLoginAt": "2025-07-29T00:00:00.000Z",
        "createdAt": "2025-07-29T00:00:00.000Z",
        "updatedAt": "2025-07-29T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### 2. ユーザー詳細取得（Manager以上）
```
GET /api/v1/users/{userId}
```

#### 3. ユーザー更新（Admin専用）
```
PUT /api/v1/users/{userId}
```

**リクエストボディ:**
```json
{
  "name": "New Name",
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "MANAGER"
}
```

#### 4. ユーザー有効化（Admin専用）
```
PUT /api/v1/users/{userId}/activate
```

#### 5. ユーザー無効化（Admin専用）
```
PUT /api/v1/users/{userId}/deactivate
```

#### 6. ユーザー削除（Admin専用）
```
DELETE /api/v1/users/{userId}
```

#### 7. 自分のプロフィール更新
```
PUT /api/v1/users/profile
```

**リクエストボディ:**
```json
{
  "name": "New Name",
  "username": "newusername"
}
```

#### 8. パスワード変更
```
PUT /api/v1/users/password
```

**リクエストボディ:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password123"
}
```

### 監査ログエンドポイント（要認証）

#### 1. 監査ログ一覧取得（Manager以上）
```
GET /api/v1/audit-logs?page=1&limit=20&userId={userId}&action={action}&startDate={date}&endDate={date}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_id",
        "action": "auth.login.success",
        "entity": "System",
        "entityId": null,
        "oldValue": null,
        "newValue": {},
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2025-07-29T00:00:00.000Z",
        "userId": "user_id",
        "user": {
          "id": "user_id",
          "username": "username",
          "name": "Full Name",
          "email": "user@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### 2. 監査ログ詳細取得（Manager以上）
```
GET /api/v1/audit-logs/{logId}
```

#### 3. ユーザー別監査ログ取得（Manager以上）
```
GET /api/v1/audit-logs/user/{userId}
```

## セキュリティ機能

### アカウントロック
- ログイン失敗が5回（設定可能）に達するとアカウントが15分間ロックされる
- ロック時にはメール通知が送信される

### メール認証
- 新規登録時にメール認証が必要
- 未認証のアカウントはログイン不可
- 認証トークンの有効期限は24時間

### パスワードリセット
- リセットトークンの有効期限は1時間
- トークンは1回のみ使用可能

### 監査ログ
以下のアクションが自動的に記録される：
- ユーザー登録、ログイン、ログアウト
- パスワード変更、リセット
- アカウントロック
- ユーザー情報の変更
- 管理者による操作

## エラーレスポンス

標準的なエラーレスポンス形式：
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### HTTPステータスコード
- 200: 成功
- 201: 作成成功
- 400: リクエストエラー
- 401: 認証エラー
- 403: 権限エラー
- 404: リソースが見つからない
- 409: 競合（既存データとの重複等）
- 500: サーバーエラー

## 開発環境での注意事項

1. **メール送信**: SMTP設定がない場合、メール送信は失敗しますが、トークンはコンソールログに出力されます
2. **初期ユーザー**: 
   - Email: `admin@example.com`
   - Password: `admin123`
   - Role: `ADMIN`
3. **CORS**: 開発環境では `http://localhost:3000` からのアクセスが許可されています

## 技術的実装詳細

### バリデーション
- メールアドレスは標準的な形式のみ受け付け（`.local`ドメインは不可）
- パスワードは最低6文字
- ユーザー名は英数字のみ、3-30文字

### 監査ログのデータ構造
監査ログは以下のフィールドで記録されます：
- `action`: 実行されたアクション
- `entity`: 対象エンティティ（"System"など）
- `entityId`: 対象エンティティのID
- `newValue`: 新しい値（JSON形式）
- `ipAddress`: クライアントIPアドレス
- `userAgent`: ユーザーエージェント

### メールサービス
以下のメールが送信されます：
- **認証メール**: ユーザー登録時
- **パスワードリセット**: リセット要求時
- **パスワードリセット完了**: リセット成功時
- **アカウントロック通知**: ロック発生時
- **ウェルカムメール**: メール認証完了時

### RBACミドルウェア
```typescript
// 使用例
router.get('/users', requireAdmin, UserController.listUsers);
router.get('/users/:id', requireManager, UserController.getUser);
router.get('/profile', requirePermission('user', 'read:own'), UserController.getProfile);
```