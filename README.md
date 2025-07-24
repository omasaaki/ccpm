# CCPM - Critical Chain Project Management

CCPMは、クリティカルチェーンプロジェクトマネジメント手法を採用したプロジェクト管理システムです。

## 🚀 Features

- **クリティカルチェーン分析**: プロジェクトのクリティカルチェーンを自動識別
- **バッファ管理**: プロジェクト、フィーディング、リソースバッファの最適配置
- **進捗監視**: フィーバーチャートによるリアルタイム進捗追跡
- **ユーザー管理**: ロールベースアクセス制御（RBAC）
- **多言語対応**: 日本語・英語対応
- **レスポンシブデザイン**: デスクトップ・タブレット・モバイル対応

## 🏗️ Architecture

### Technology Stack

**Backend:**
- TypeScript + Node.js + Express.js
- PostgreSQL + Prisma ORM
- Redis (キャッシュ・セッション管理)
- JWT認証 + MFA

**Frontend:**
- React + TypeScript
- Material-UI (MUI)
- Redux Toolkit
- Vite

**Infrastructure:**
- Docker + Docker Compose
- Nginx (リバースプロキシ)

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │────│   (Node.js)     │────│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Cache)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 🛠️ Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (ローカル開発時)
- Git

### Quick Start

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/your-username/ccpm.git
   cd ccpm
   ```

2. **開発環境セットアップ**
   ```bash
   # 自動セットアップスクリプト実行
   ./scripts/setup-dev.sh
   ```

3. **依存関係インストール**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **開発環境起動**
   ```bash
   # Docker Compose で全サービス起動
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```

5. **アクセス**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database Admin: http://localhost:8080
   - Redis Commander: http://localhost:8081

### Manual Setup

環境変数ファイルを作成：
```bash
cp .env.example .env
# 必要に応じて .env を編集
```

### Available Scripts

**Backend:**
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run test         # テスト実行
npm run lint         # ESLint実行
npm run typecheck    # TypeScript型チェック
```

**Frontend:**
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run preview      # プロダクションプレビュー
npm run test         # テスト実行
npm run lint         # ESLint実行
```

**Docker:**
```bash
# 開発環境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 本番環境
docker-compose --profile production up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

## 📁 Project Structure

```
ccpm/
├── backend/                 # Backend application
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── tests/               # Test files
│   ├── prisma/              # Database schema & migrations
│   └── Dockerfile
├── frontend/                # Frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Redux store
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── Dockerfile
├── database/                # Database related files
│   ├── migrations/          # Database migrations
│   └── seeds/               # Seed data
├── doc/                     # Documentation
├── project_management/      # Project management files
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Docker Compose configuration
├── docker-compose.dev.yml   # Development overrides
└── .env.example             # Environment variables template
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # 全テスト実行
npm run test:watch        # Watch mode
npm run test:coverage     # カバレッジ付きテスト

# Frontend tests
cd frontend
npm run test              # 全テスト実行
npm run test:ui           # UI mode
npm run test:coverage     # カバレッジ付きテスト
```

## 📊 Database

### Database Setup

```bash
# Prisma migration
cd backend
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database
npm run prisma:seed

# Database studio
npm run prisma:studio
```

### Database Schema

主要テーブル：
- `users` - ユーザー管理
- `projects` - プロジェクト
- `tasks` - タスク
- `dependencies` - タスク依存関係
- `critical_chains` - クリティカルチェーン
- `buffers` - バッファ管理

## 🔒 Security

- JWT認証 + リフレッシュトークン
- RBAC (Role-Based Access Control)
- OWASP Top 10対策
- データ暗号化 (AES-256-GCM)
- HTTPS/TLS 1.3
- Rate limiting
- Input validation & sanitization

## 🌐 API Documentation

開発環境でSwagger UIが利用可能：
- http://localhost:3001/api-docs

## 🚢 Deployment

### Production Build

```bash
# Frontend build
cd frontend
npm run build

# Backend build
cd backend  
npm run build

# Docker production build
docker-compose --profile production up -d
```

### Environment Variables

本番環境では以下の環境変数を設定：

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-production-jwt-secret
ENCRYPTION_KEY=your-production-encryption-key
```

## 🤝 Contributing

1. Feature branchを作成
2. 変更をコミット
3. Pull Requestを作成

### Commit Message Convention

```
<type>(<scope>): <description>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### よくある問題

**Docker build fails:**
```bash
# Docker cache をクリア
docker system prune -a
docker-compose build --no-cache
```

**Permission errors:**
```bash
# ディレクトリ権限を修正
sudo chown -R $USER:$USER .
```

**Port conflicts:**
```bash
# .env ファイルでポート番号を変更
FRONTEND_PORT=3001
BACKEND_PORT=3002
```

### Support

- Issues: https://github.com/your-username/ccpm/issues
- Documentation: [doc/](doc/)
- Project Management: [project_management/](project_management/)

---

**CCPM Development Team**  
Last updated: 2025-01-22
