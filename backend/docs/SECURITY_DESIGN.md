# セキュリティ設計書

## 概要

CCPMシステムにおけるセキュリティ設計と実装の詳細を記載します。

## 1. 認証システム

### 1.1 JWT (JSON Web Token) 認証

#### トークン構成
- **アクセストークン**
  - 有効期限: 24時間
  - 用途: API認証
  - ペイロード: userId, email, role
  
- **リフレッシュトークン**
  - 有効期限: 7日間
  - 用途: アクセストークンの更新
  - データベースに保存され、無効化可能

#### トークン管理
```typescript
// トークン生成
const tokens = {
  accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }),
  refreshToken: jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
};
```

### 1.2 パスワード管理

#### ハッシュ化
- bcryptを使用（ソルトラウンド: 12）
- パスワードは平文で保存されない

```typescript
const hashedPassword = await bcrypt.hash(password, 12);
```

#### パスワード要件
- 最小長: 6文字
- 将来的に複雑性要件を追加可能

### 1.3 セッション管理

#### リフレッシュトークンローテーション
- 使用済みトークンは無効化
- 新しいトークンペアを発行
- 不正利用の検知が可能

## 2. 認可システム (RBAC)

### 2.1 ロール定義

| ロール | 権限 |
|--------|------|
| ADMIN | 全リソースへの完全なアクセス権 |
| MANAGER | プロジェクト管理、ユーザー閲覧権限 |
| USER | 自身のリソースへのアクセス権のみ |

### 2.2 権限マトリックス

```typescript
const rolePermissions = {
  ADMIN: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'project:create', 'project:read', 'project:update', 'project:delete',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'audit:read'
  ],
  MANAGER: [
    'user:read',
    'project:create', 'project:read', 'project:update:own', 'project:delete:own',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'audit:read'
  ],
  USER: [
    'user:read:own', 'user:update:own',
    'project:read:own', 'project:update:own',
    'task:read:own', 'task:update:own'
  ]
};
```

### 2.3 ミドルウェア実装

```typescript
// 権限チェックミドルウェア
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hasPermission = checkUserPermission(req.user, resource, action);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## 3. セキュリティ機能

### 3.1 アカウントロック機能

#### 実装詳細
- ログイン失敗閾値: 5回（環境変数で設定可能）
- ロック期間: 15分（環境変数で設定可能）
- ロック時にメール通知

#### データベース設計
```prisma
model User {
  failedLoginAttempts Int       @default(0)
  lockoutUntil        DateTime?
}
```

### 3.2 メール認証

#### フロー
1. ユーザー登録時に検証トークン生成
2. 検証メール送信
3. トークン有効期限: 24時間
4. 未認証アカウントはログイン不可

#### 実装
```typescript
const emailVerificationToken = crypto.randomBytes(32).toString('hex');
```

### 3.3 パスワードリセット

#### セキュリティ対策
- トークンは1回限り有効
- 有効期限: 1時間
- 使用後は即座に無効化
- ユーザー存在確認を隠蔽（レスポンスは常に同じ）

### 3.4 監査ログ

#### 記録対象アクション
- 認証関連: login, logout, register, password_reset
- ユーザー管理: create, update, delete, role_change
- データアクセス: read, create, update, delete
- セキュリティイベント: account_locked, failed_login

#### ログ構造
```typescript
interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

## 4. API セキュリティ

### 4.1 ヘッダーセキュリティ

Helmetミドルウェアによる保護:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

### 4.2 CORS設定

```typescript
cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
})
```

### 4.3 レート制限

現在未実装、将来的に追加予定:
- ログインエンドポイント: 5回/分
- API全般: 100回/分

### 4.4 入力検証

Joiによるリクエスト検証:
```typescript
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
```

## 5. データ保護

### 5.1 暗号化

- パスワード: bcrypt (ソルト付きハッシュ)
- トークン: 暗号的に安全な乱数生成
- 通信: HTTPS必須（本番環境）

### 5.2 機密情報の扱い

- 環境変数での管理
- ログに機密情報を含めない
- エラーメッセージでの情報漏洩防止

## 6. セキュリティベストプラクティス

### 6.1 開発時の注意事項

1. **依存関係の管理**
   - 定期的な脆弱性スキャン
   - npm auditの実行

2. **コードレビュー**
   - セキュリティ観点でのレビュー
   - SQLインジェクション対策（Prisma使用）

3. **エラーハンドリング**
   - スタックトレースの非表示（本番環境）
   - 一般的なエラーメッセージ

### 6.2 運用時の注意事項

1. **環境変数**
   ```bash
   # JWT設定
   JWT_SECRET=<強力なランダム文字列>
   JWT_REFRESH_SECRET=<別の強力なランダム文字列>
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # データベース
   DATABASE_URL=<接続文字列>
   
   # メール設定
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<メールアドレス>
   SMTP_PASS=<パスワード>
   EMAIL_FROM=noreply@ccpm.com
   
   # アプリケーション設定
   APP_URL=http://localhost:3000
   
   # セキュリティ設定
   AUTH_LOCKOUT_THRESHOLD=5
   AUTH_LOCKOUT_DURATION=900000
   PASSWORD_RESET_EXPIRATION=3600000
   EMAIL_VERIFICATION_EXPIRATION=86400000
   ```

2. **監査ログの監視**
   - 異常なログイン試行
   - 権限昇格の試み
   - 大量のデータアクセス

3. **定期的なセキュリティ更新**
   - 依存関係の更新
   - セキュリティパッチの適用

## 7. インシデント対応

### 7.1 アカウント侵害時

1. 該当アカウントの即時無効化
2. 全リフレッシュトークンの無効化
3. パスワードリセットの強制
4. 監査ログの調査

### 7.2 データ漏洩時

1. 影響範囲の特定（監査ログ使用）
2. アクセスの一時停止
3. 関係者への通知
4. 原因調査と対策

## 8. 今後の改善計画

1. **多要素認証 (MFA)**
   - TOTP/SMS認証の実装

2. **レート制限**
   - express-rate-limitの導入

3. **IPホワイトリスト**
   - 管理者アクセスの制限

4. **セッション管理の強化**
   - デバイス管理
   - 同時ログイン制限

5. **暗号化の強化**
   - データベース暗号化
   - 通信の相互認証