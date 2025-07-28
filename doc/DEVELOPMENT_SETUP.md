# 開発環境構築ガイド - CCPM システム

## 概要

このドキュメントでは、CCPMシステムの開発環境構築手順を説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります：

- **Docker**: 20.10以降
- **Docker Compose**: 2.0以降（またはDocker Desktop）
- **Node.js**: 18.0以降（ローカル開発時）
- **Git**: 最新版
- **OS**: Windows (WSL2), macOS, Linux

## 構築手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/omasaaki/ccpm.git
cd ccpm
```

### 2. 環境変数の設定

開発用環境変数ファイルをコピーして作成：

```bash
cp .env.development .env
```

必要に応じて `.env` ファイルを編集します。デフォルト設定で動作しますが、ポート番号が競合する場合は変更してください。

### 3. Docker環境の起動

#### 自動セットアップ（推奨）

```bash
# セットアップスクリプトを実行
./scripts/setup-dev.sh

# セットアップ完了後、コンテナを起動
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

セットアップスクリプトは以下を実行します：
- Docker/Docker Composeの確認
- 環境変数ファイルの作成
- 開発環境の構築手順表示

**注意**: スクリプト実行後、手動でコンテナを起動する必要があります。

#### 手動セットアップ

```bash
# 開発環境用Docker Composeで起動
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# ログを確認
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### 4. 依存関係のインストール（ローカル開発時）

Dockerを使用しない場合、または IDE の補完機能を使用する場合：

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 5. データベースのセットアップ

初回起動時はデータベースの初期化が必要です：

```bash
# Backendコンテナに入る
docker compose exec backend sh

# Prisma Client生成
npx prisma generate

# Prismaマイグレーションを実行（初回）
npx prisma migrate dev --name init

# 初期データを投入
npm run prisma:seed
```

**注意**: 初回起動時、BackendとFrontendが正常に起動しない場合は、基本的なアプリケーションファイルが作成されるまで待機してください。開発環境が完全に初期化されると自動的に動作します。

### 6. アクセス確認

以下のURLにアクセスして動作を確認：

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Status**: http://localhost:3001/api/v1/status
- **Health Check**: http://localhost:3001/health
- **Adminer** (DB管理): http://localhost:8080
  - システム: `PostgreSQL`
  - サーバー: `postgres`
  - ユーザー名: `ccpm_dev_user`
  - パスワード: `ccpm_dev_password`
  - データベース: `ccpm_dev`
- **Redis Commander**: http://localhost:8081

## 開発作業フロー

### 1. コード変更

- **Backend**: `backend/src/` 配下のファイルを編集
- **Frontend**: `frontend/src/` 配下のファイルを編集
- ホットリロードが有効なので、変更は自動的に反映されます

### 2. データベース変更

Prismaスキーマを変更した場合：

```bash
# スキーマファイルを編集
vim backend/prisma/schema.prisma

# マイグレーション作成
cd backend
npx prisma migrate dev --name add_new_table

# Prismaクライアント再生成
npx prisma generate
```

### 3. テスト実行

```bash
# Backend
cd backend
npm run test
npm run test:coverage

# Frontend
cd frontend
npm run test
npm run test:coverage
```

### 4. コード品質チェック

```bash
# Backend
cd backend
npm run lint
npm run typecheck

# Frontend
cd frontend
npm run lint
npm run typecheck
```

## よくあるトラブルシューティング

### ポート競合

他のアプリケーションがポートを使用している場合：

`.env` ファイルで以下を変更：
```bash
FRONTEND_PORT=3001
BACKEND_PORT=3002
POSTGRES_PORT=5433
REDIS_PORT=6380
```

### Dockerビルドエラー

キャッシュをクリアして再ビルド：
```bash
docker compose down
docker system prune -a
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 権限エラー（Linux/WSL）

```bash
sudo chown -R $USER:$USER .
```

### データベース接続エラー

PostgreSQLコンテナが正常に起動しているか確認：
```bash
docker compose ps
docker compose logs postgres
```

### node_modules関連のエラー

```bash
# コンテナ内のnode_modulesを削除
docker compose down
docker volume rm ccpm_backend_node_modules ccpm_frontend_node_modules

# 再起動
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Docker Composeコマンド一覧

```bash
# 起動
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 停止
docker compose down

# 再起動
docker compose restart

# ログ確認
docker compose logs -f [service_name]

# コンテナに入る
docker compose exec backend sh
docker compose exec frontend sh

# ボリューム含めて削除
docker compose down -v

# 特定サービスのみ起動
docker compose up -d postgres redis

# ビルドして起動
docker compose up -d --build
```

## 開発ツール

### Adminer (データベース管理)

http://localhost:8080 でアクセス可能。データベースの内容を確認・編集できます。

### Redis Commander

http://localhost:8081 でアクセス可能。Redisのキャッシュデータを確認できます。

### Prisma Studio

データベースをGUIで管理：
```bash
cd backend
npm run prisma:studio
```

## VSCode推奨拡張機能

- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマット
- **TypeScript**: TypeScript言語サポート
- **Prisma**: Prismaスキーマサポート
- **Docker**: Docker関連ファイルサポート
- **Thunder Client**: REST APIテスト

## 次のステップ

開発環境の構築が完了したら、以下のドキュメントを参照してください：

- [アーキテクチャ設計書](DESIGN_ARCHITECTURE.md)
- [API設計書](DESIGN_API.md)
- [データベース設計書](DESIGN_DATABASE.md)
- [プロジェクト管理ルール](../project_management/README.md)

## FAQ・トラブルシューティング

### Docker関連

#### Q1: `npm ci` エラーが発生する
**エラー**: `The 'npm ci' command can only install with an existing package-lock.json`

**解決方法**:
```bash
# コンテナを停止して再ビルド
docker compose down
docker compose build --no-cache
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**原因**: package-lock.jsonが存在しないため。Dockerfileで`npm install`を使用するよう修正済み。

#### Q2: Frontend依存関係競合エラー
**エラー**: `Could not resolve dependency: peer react@"^16.3.2" from react-gantt-timeline`

**解決方法**: 既に修正済み。問題のあるパッケージを削除し、`--legacy-peer-deps`オプションを追加。

#### Q3: Docker Compose version警告
**警告**: `the attribute 'version' is obsolete, it will be ignored`

**解決方法**: 無視して問題ありません。最新のDocker Composeではversion属性が不要になりました。

### ポート競合

#### Q4: PostgreSQLポート5432が使用中
**エラー**: `failed to bind host port for 0.0.0.0:5432: address already in use`

**解決方法**:
```bash
# システムのPostgreSQLが使用中の場合
sudo systemctl status postgresql
sudo systemctl stop postgresql  # 必要に応じて停止

# または環境変数でポート変更
POSTGRES_PORT=5433 docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**デフォルト設定**: 開発環境では5433ポートを使用するよう設定済み。

### WSL2環境

#### Q5: Docker権限エラー
**エラー**: `permission denied while trying to connect to the Docker daemon socket`

**解決方法**:
```bash
# 方法1: グループ権限更新
newgrp docker

# 方法2: 一時的権限付与
sudo chmod 666 /var/run/docker.sock

# 方法3: WSL再起動
# Windows PowerShellで: wsl --shutdown && wsl
```

#### Q6: WindowsからAdminer/Redis Commanderにアクセスできない
**症状**: Connection TimeoutやERR_CONNECTION_TIMED_OUT

**解決方法**:
1. **正しいURL使用**: `http://localhost:8080` (IPアドレスではなく)
2. **管理ツール起動確認**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev-tools up -d adminer redis-commander
   docker compose ps  # 起動状況確認
   ```
3. **Windowsファイアウォール設定**（必要に応じて):
   ```powershell
   # PowerShell管理者権限で実行
   New-NetFirewallRule -DisplayName "WSL2 Adminer" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "WSL2 Redis Commander" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
   ```

### データベース接続

#### Q7: Adminerでデータベースに接続できない
**接続情報**:
```
システム: PostgreSQL
サーバー: postgres
ユーザー名: ccpm_dev_user
パスワード: ccpm_dev_password
データベース: ccpm_dev
```

**注意**: サーバー名は`localhost`ではなく`postgres`（Docker内部のサービス名）

#### Q8: Redis Commanderが表示されない
**確認事項**:
1. コンテナが起動しているか: `docker compose ps`
2. ポート8081が使用中でないか: `ss -tlnp | grep 8081`
3. ブラウザで http://localhost:8081 にアクセス

### 一般的な問題

#### Q9: コンテナが起動しない
**診断手順**:
```bash
# ログ確認
docker compose logs [service_name]

# コンテナ状態確認  
docker compose ps

# イメージ再ビルド
docker compose build --no-cache

# 完全リセット
docker compose down -v
docker system prune -a
```

#### Q10: 開発環境の完全リセット方法
```bash
# 1. 全コンテナ・ボリューム削除
docker compose down -v

# 2. 使用していないイメージ・キャッシュ削除
docker system prune -a

# 3. 再起動
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

#### Q11: ts-node実行エラー
**エラー**: `Cannot find module 'tsconfig-paths/register'`

**解決方法**: TypeScript設定を簡素化済み。問題が発生する場合：
```bash
# コンテナ再ビルド
docker compose build --no-cache backend
docker compose restart backend
```

**原因**: 複雑なTypeScript設定との競合。基本設定で安定動作を優先。

#### Q12: Backend/Frontend初回起動失敗
**症状**: `Cannot find module '/app/src/index.ts'` または `Cannot find module '/app/dist/index.js'`

**解決方法**: 基本アプリケーションファイルが自動作成されるまで待機：
```bash
# ログで確認
docker compose logs -f backend
docker compose logs -f frontend

# 必要に応じてコンテナ再起動
docker compose restart backend frontend
```

**原因**: 初回セットアップ時、基本的なソースファイルが段階的に生成されるため。

## 開発環境構築作業ログ (2025-01-22, 2025-01-24)

### 解決した主な問題
1. ✅ package-lock.json未存在エラー → `npm install`使用に変更
2. ✅ Frontend依存関係競合 → 問題パッケージ削除・`--legacy-peer-deps`追加  
3. ✅ PostgreSQLポート競合 → デフォルトポート5433に変更
4. ✅ Docker権限問題 → `newgrp docker`で解決
5. ✅ WSL2アクセス問題 → `localhost`使用で解決
6. ✅ Prisma OpenSSLエラー → Alpine Linux用OpenSSL設定追加
7. ✅ ts-node設定エラー → TypeScript設定簡素化
8. ✅ 基本アプリケーションファイル不足 → Express.js・React基本構成作成

### 最終構成
| サービス | ポート | アクセスURL | 状態 |
|---------|--------|-------------|------|
| Frontend (React) | 3000 | http://localhost:3000 | ✅ 動作確認済み |
| Backend (Express) | 3001 | http://localhost:3001 | ✅ 動作確認済み |
| PostgreSQL | 5433 | localhost:5433 | ✅ 正常動作 |
| Redis | 6380 | localhost:6380 | ✅ 正常動作 |
| Adminer | 8080 | http://localhost:8080 | ✅ 正常動作 |
| Redis Commander | 8081 | http://localhost:8081 | ✅ 正常動作 |

### 作成されたファイル
- `backend/src/index.ts` - Express.js基本サーバー
- `frontend/src/App.tsx` - React + Material-UI基本アプリ  
- `frontend/src/main.tsx` - Reactエントリーポイント
- `frontend/index.html` - HTML テンプレート
- `backend/prisma/schema.prisma` - データベーススキーマ
- `backend/prisma/seed.ts` - サンプルデータ

---

## 更新履歴

| 日付 | 版数 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2025-01-22 | 1.0 | 初版作成 | - |
| 2025-01-22 | 1.1 | FAQ・トラブルシューティング追加、作業ログ追加 | - |
| 2025-01-24 | 1.2 | Prisma・ts-node関連問題解決、基本アプリ作成完了を反映 | - |