# CI/CD設計書 - CCPM システム

## 概要

このドキュメントでは、CCPMシステムの継続的インテグレーション/継続的デプロイメント（CI/CD）パイプラインの設計を定義します。

## 設計目標

### 品質目標
- コード品質の一定水準維持
- 自動テストによる回帰テスト防止
- セキュリティ脆弱性の早期発見
- テストカバレッジ80%以上の維持

### 効率性目標
- 開発サイクルの高速化
- 手動デプロイ作業の削減
- リリース作業の標準化
- ロールバック機能の実装

## CI/CDアーキテクチャ

### 全体構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │  GitHub Actions │    │   Deployment    │
│   (Git Push)    │───▶│   Workflows     │───▶│   Environments  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Quality       │
                       │   Checks        │
                       └─────────────────┘
```

### ワークフロー構成

#### 1. Pull Request ワークフロー（ci.yml）
```yaml
Trigger: Pull Request作成・更新
Jobs:
  - code-quality:     並列実行
    - Backend lint/typecheck
    - Frontend lint/typecheck
  - test:            依存: code-quality
    - Backend unit tests
    - Frontend unit tests
  - security:        並列実行
    - Dependency scan
    - SAST scan
  - build:           依存: test
    - Docker image build
    - Build artifact generation
```

#### 2. メインブランチワークフロー（deploy.yml）
```yaml
Trigger: main branch への push
Jobs:
  - quality-gate:    継承: PR checks
  - build-images:    依存: quality-gate
    - Production Docker images
    - Tag with version
  - deploy-staging:  依存: build-images
    - Staging environment
    - Smoke tests
  - deploy-prod:     手動承認後
    - Production deployment
    - Health checks
```

## ワークフロー詳細設計

### Code Quality Jobs

#### Backend Quality Check
```yaml
- name: Backend Quality
  working-directory: ./backend
  steps:
    - TypeScript compile check
    - ESLint execution
    - Prettier format check
    - Import organization check
```

#### Frontend Quality Check
```yaml
- name: Frontend Quality
  working-directory: ./frontend
  steps:
    - TypeScript compile check
    - ESLint execution
    - Prettier format check
    - Build test execution
```

### Test Jobs

#### Backend Testing
```yaml
- name: Backend Tests
  services:
    - postgres: 15
    - redis: 7
  steps:
    - Unit tests execution
    - Integration tests execution
    - Coverage report generation
    - Coverage threshold check (80%)
```

#### Frontend Testing
```yaml
- name: Frontend Tests
  steps:
    - Unit tests execution
    - Component tests execution
    - Coverage report generation
    - Coverage threshold check (80%)
```

### Security Jobs

#### Dependency Scanning
```yaml
- name: Dependency Security
  steps:
    - npm audit (Backend/Frontend)
    - Trivy vulnerability scan
    - License compliance check
```

#### Static Application Security Testing (SAST)
```yaml
- name: SAST Scan
  steps:
    - CodeQL analysis
    - Semgrep security rules
    - Secret detection
```

### Build Jobs

#### Docker Image Build
```yaml
- name: Docker Build
  strategy:
    matrix:
      service: [backend, frontend]
  steps:
    - Multi-stage build
    - Image optimization
    - Security scanning
    - Registry push
```

## 環境管理設計

### 環境構成

| 環境 | 用途 | トリガー | 承認 |
|------|------|----------|------|
| Development | 開発者個人環境 | Local | なし |
| Staging | 統合テスト環境 | main push | 自動 |
| Production | 本番環境 | 手動実行 | 必須 |

### 環境変数管理

#### Repository Secrets
```yaml
DOCKER_REGISTRY_URL      # Docker レジストリURL
DOCKER_REGISTRY_USER     # レジストリユーザー名
DOCKER_REGISTRY_TOKEN    # レジストリアクセストークン
STAGING_DEPLOY_KEY       # Staging デプロイ鍵
PRODUCTION_DEPLOY_KEY    # Production デプロイ鍵
```

#### Environment Secrets
```yaml
# Staging Environment
DATABASE_URL_STAGING     # Staging DB接続情報
REDIS_URL_STAGING        # Staging Redis接続情報
JWT_SECRET_STAGING       # Staging JWT秘密鍵

# Production Environment  
DATABASE_URL_PROD        # Production DB接続情報
REDIS_URL_PROD           # Production Redis接続情報
JWT_SECRET_PROD          # Production JWT秘密鍵
```

## デプロイメント戦略

### デプロイメント方式

#### Staging Environment
- **方式**: Docker Compose based deployment
- **更新戦略**: Blue-Green deployment
- **ヘルスチェック**: HTTP endpoint monitoring
- **ロールバック**: 前バージョンへの自動切り戻し

#### Production Environment
- **方式**: Docker Compose based deployment
- **更新戦略**: Rolling update with zero-downtime
- **ヘルスチェック**: 多段階ヘルスチェック
- **ロールバック**: 手動承認によるロールバック

### デプロイメントフロー

#### Staging Deployment
```yaml
1. Docker images pull
2. Database migration (if needed)
3. Service update (rolling)
4. Health check execution
5. Smoke test execution
6. Notification (Slack/Email)
```

#### Production Deployment
```yaml
1. Manual approval request
2. Pre-deployment checks
3. Database backup
4. Docker images pull
5. Blue-Green deployment
6. Health check execution
7. Traffic switching
8. Post-deployment verification
9. Monitoring setup
10. Notification
```

## 品質ゲート設計

### コード品質基準

| メトリクス | 閾値 | 処理 |
|------------|------|------|
| Test Coverage | 80%以上 | 未満時はPRブロック |
| ESLint Errors | 0件 | エラー時はPRブロック |
| TypeScript Errors | 0件 | エラー時はPRブロック |
| Security Issues | High: 0件 | High以上でPRブロック |

### 自動化ルール

#### PR作成時
- 全品質チェック実行
- テストカバレッジ確認
- セキュリティスキャン実行
- 通過時のみマージ可能

#### メインブランチ
- 品質ゲート通過確認
- Production build test
- Staging環境への自動デプロイ

## モニタリング設計

### CI/CDメトリクス

#### パフォーマンス指標
- Build時間（目標: 5分以内）
- Test実行時間（目標: 3分以内）
- Deploy時間（目標: 2分以内）

#### 品質指標
- PR成功率（目標: 95%以上）
- Production deploy成功率（目標: 99%以上）
- Rollback発生率（目標: 5%以下）

### アラート設定

#### 失敗時通知
- Build失敗時: Slack通知
- Deploy失敗時: Email + Slack通知
- Security issue検出時: 即座に通知

#### 定期レポート
- 週次: CI/CDメトリクスレポート
- 月次: セキュリティスキャン結果
- 四半期: パフォーマンス改善提案

## セキュリティ考慮事項

### パイプラインセキュリティ

#### アクセス制御
- Repository secrets の適切な管理
- Environment protection rules
- 最小権限の原則適用

#### 脆弱性対策
- 定期的な依存関係更新
- Base image の定期更新
- Secrets の定期ローテーション

### 監査ログ

#### 記録項目
- Deploy実行ログ
- 承認履歴
- セキュリティスキャン結果
- 品質メトリクス履歴

## 災害対策・継続性

### バックアップ戦略
- Docker images のバックアップ
- Configuration の version管理
- Database backup の自動化

### 復旧手順
- Production環境の迅速な復旧
- データ整合性確認
- サービス可用性の確認

## 詳細実装設計

### GitHub Actions ワークフロー詳細

#### 1. CI ワークフロー (.github/workflows/ci.yml)

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  # Backend Quality Check
  backend-quality:
    name: Backend Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: TypeScript check
        working-directory: ./backend
        run: npm run typecheck
      
      - name: ESLint check
        working-directory: ./backend
        run: npm run lint
      
      - name: Prettier check
        working-directory: ./backend
        run: npx prettier --check "src/**/*.{ts,js}"

  # Frontend Quality Check
  frontend-quality:
    name: Frontend Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: TypeScript check
        working-directory: ./frontend
        run: npm run typecheck
      
      - name: ESLint check
        working-directory: ./frontend
        run: npm run lint
      
      - name: Build test
        working-directory: ./frontend
        run: npm run build

  # Backend Tests
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest
    needs: backend-quality
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: ccpm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run Prisma migrations
        working-directory: ./backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/ccpm_test
      
      - name: Run tests with coverage
        working-directory: ./backend
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/ccpm_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage
          flags: backend

  # Frontend Tests
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    needs: frontend-quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run tests with coverage
        working-directory: ./frontend
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
          flags: frontend

  # Security Scanning
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Backend npm audit
        working-directory: ./backend
        run: npm audit --audit-level=high
      
      - name: Frontend npm audit
        working-directory: ./frontend
        run: npm audit --audit-level=high

  # Docker Build Test
  docker-build:
    name: Docker Build Test
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    if: github.event_name == 'pull_request'
    strategy:
      matrix:
        service: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          cd ${{ matrix.service }}
          docker build -t ccpm-${{ matrix.service }}:test .
      
      - name: Test Docker image
        run: |
          docker run --rm ccpm-${{ matrix.service }}:test --version || true
```

#### 2. Deploy ワークフロー (.github/workflows/deploy.yml)

```yaml
name: Deploy Pipeline

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production

jobs:
  # Build and Push Docker Images
  build-and-push:
    name: Build and Push Images
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_REGISTRY_USER }}
          password: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKER_REGISTRY_URL }}/ccpm-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # SSH deployment script would go here
      
      - name: Run health checks
        run: |
          echo "Running health checks..."
          # Health check scripts would go here

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-and-push, deploy-staging]
    if: github.event.inputs.environment == 'production'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # SSH deployment script would go here
      
      - name: Run health checks
        run: |
          echo "Running production health checks..."
          # Health check scripts would go here
```

### Package.json スクリプト拡張

#### Backend追加スクリプト
```json
{
  "scripts": {
    "ci:typecheck": "tsc --noEmit",
    "ci:lint": "eslint src --ext .ts --max-warnings 0",
    "ci:test": "jest --ci --coverage --watchAll=false",
    "ci:audit": "npm audit --audit-level=high",
    "docker:build:prod": "docker build -t ccpm-backend:latest .",
    "docker:push": "docker push ccpm-backend:latest"
  }
}
```

#### Frontend追加スクリプト
```json
{
  "scripts": {
    "ci:typecheck": "tsc --noEmit",
    "ci:lint": "eslint src --ext ts,tsx --max-warnings 0",
    "ci:test": "vitest run --coverage",
    "ci:build": "tsc && vite build",
    "ci:audit": "npm audit --audit-level=high",
    "docker:build:prod": "docker build -t ccpm-frontend:latest .",
    "docker:push": "docker push ccmp-frontend:latest"
  }
}
```

## 技術仕様

### 使用技術

| カテゴリ | 技術 | バージョン |
|----------|------|------------|
| CI/CD Platform | GitHub Actions | Latest |
| Container Registry | Docker Hub | Latest |
| Security Scanning | Trivy, CodeQL | Latest |
| Quality Tools | ESLint, Prettier | Latest |
| Testing | Jest, Vitest | Latest |

### パフォーマンス要件

| 項目 | 要件 |
|------|------|
| CI実行時間 | 5分以内 |
| Deploy時間 | 2分以内 |
| 同時実行数 | 5ジョブまで |
| アーティファクト保持 | 30日 |

## 運用手順

### 定期メンテナンス
- 月次: Dependencies update
- 四半期: Base images update
- 年次: CI/CD設定見直し

### トラブルシューティング
- ログ収集手順
- 障害時の連絡体制
- エスカレーション基準

---

## 更新履歴

| 日付 | 版数 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2025-01-24 | 1.0 | 初版作成 | - |

---

**注意**: この設計書は CCPM-011 チケットの一環として作成されています。