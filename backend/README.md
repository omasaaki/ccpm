# CCPM Backend

Critical Chain Project Management (CCPM) システムのバックエンドAPIサーバーです。

## 技術スタック

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Validation**: Joi
- **Security**: Helmet, bcrypt

## 機能

### 認証・認可
- JWT ベースの認証システム
- ロールベースアクセス制御 (RBAC)
- メール認証機能
- パスワードリセット機能
- アカウントロック機能（ブルートフォース対策）
- 監査ログ機能

### プロジェクト管理
- プロジェクトのCRUD操作
- タスク管理
- 依存関係の管理

## セットアップ

### 前提条件
- Node.js 18.x 以上
- Docker & Docker Compose
- PostgreSQL（Dockerで提供）

### インストール

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
# .envファイルを作成（プロジェクトルートの.envを参照）
cp ../.env.example ../.env
```

主要な環境変数:
```bash
# JWT設定
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# メール設定（オプション）
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password

# セキュリティ設定
AUTH_LOCKOUT_THRESHOLD=5
AUTH_LOCKOUT_DURATION=900000
```

3. データベースのセットアップ
```bash
# Docker環境の起動
docker-compose up -d

# マイグレーションの実行
npx prisma migrate dev

# 初期データの投入
npx prisma db seed
```

### 開発サーバーの起動

```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

## API ドキュメント

詳細なAPI仕様は以下のドキュメントを参照してください：

- [認証・認可 API](./docs/API_AUTH.md)
- [セキュリティ設計書](./docs/SECURITY_DESIGN.md)

### 主要エンドポイント

#### 認証
- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/logout` - ログアウト
- `GET /api/v1/auth/profile` - プロフィール取得
- `POST /api/v1/auth/refresh` - トークンリフレッシュ

#### ユーザー管理（要認証）
- `GET /api/v1/users` - ユーザー一覧（Admin/Manager）
- `GET /api/v1/users/:id` - ユーザー詳細（Manager以上）
- `PUT /api/v1/users/:id` - ユーザー更新（Admin）
- `DELETE /api/v1/users/:id` - ユーザー削除（Admin）

#### プロジェクト（要認証）
- `GET /api/v1/projects` - プロジェクト一覧
- `POST /api/v1/projects` - プロジェクト作成
- `GET /api/v1/projects/:id` - プロジェクト詳細
- `PUT /api/v1/projects/:id` - プロジェクト更新
- `DELETE /api/v1/projects/:id` - プロジェクト削除

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクション実行
npm start

# テスト実行
npm test

# リント実行
npm run lint

# 型チェック
npm run typecheck

# Prisma Studio起動
npm run studio
```

## セキュリティ

### 実装済みのセキュリティ機能

1. **認証・認可**
   - JWT トークンベース認証
   - ロールベースアクセス制御（ADMIN, MANAGER, USER）
   - リフレッシュトークンのローテーション

2. **アカウント保護**
   - パスワードのbcryptハッシュ化（ソルト付き）
   - ログイン失敗によるアカウントロック
   - メール認証必須

3. **監査・監視**
   - 全認証アクションの監査ログ
   - IPアドレス・ユーザーエージェント記録
   - 失敗したログイン試行の追跡

4. **API保護**
   - Helmetによるセキュリティヘッダー
   - CORS設定
   - 入力検証（Joi）

### デフォルト管理者アカウント

開発環境では以下の管理者アカウントが作成されます：

- **Email**: admin@example.com
- **Password**: admin123
- **Role**: ADMIN

**注意**: 本番環境では必ず変更してください。

## トラブルシューティング

### ポート競合
デフォルトでポート3001を使用します。変更する場合は環境変数 `BACKEND_PORT` を設定してください。

### データベース接続エラー
1. Docker が起動していることを確認
2. `docker-compose ps` でPostgreSQLコンテナの状態を確認
3. 環境変数 `DATABASE_URL` が正しく設定されているか確認

### マイグレーションエラー
```bash
# データベースをリセットして再作成
npx prisma migrate reset
```

### 認証関連のトラブル
1. **メール送信失敗**
   - SMTP設定を確認
   - 開発環境では認証トークンがコンソールに出力される

2. **監査ログが記録されない**
   - Prismaクライアントが正しく生成されているか確認
   - データベーススキーマとサービスのフィールド名が一致しているか確認

3. **トークンエラー**
   - JWT_SECRETとJWT_REFRESH_SECRETが設定されているか確認
   - トークンの有効期限を確認

4. **権限エラー**
   - ユーザーのロールが正しく設定されているか確認
   - RBACミドルウェアが正しく適用されているか確認

## 開発ガイドライン

1. **コーディング規約**
   - ESLint設定に従う
   - TypeScriptの厳格モードを使用
   - async/awaitを使用（コールバックは避ける）

2. **コミット規約**
   - 意味のある単位でコミット
   - 日本語でのコミットメッセージ可

3. **セキュリティ**
   - 機密情報をコードに含めない
   - 環境変数を使用
   - 入力検証を必ず実装

## ライセンス

Private