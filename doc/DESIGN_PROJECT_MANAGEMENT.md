# プロジェクト管理機能設計書

## 1. 概要

プロジェクト管理機能は、CCPMシステムのコア機能であり、プロジェクトの作成、管理、メンバー割り当て、進捗追跡を行う。

## 2. 機能要件

### 2.1 プロジェクトCRUD機能
- プロジェクトの作成・更新・削除・参照
- プロジェクトステータス管理（計画中、進行中、保留、完了、キャンセル）
- プロジェクトのアーカイブ/復元

### 2.2 プロジェクトメンバー管理
- メンバーの追加・削除
- 役割の割り当て（PM、メンバー、閲覧者）
- リソース割り当て率の設定

### 2.3 プロジェクト設定
- 基本情報（名前、説明、開始日、終了日）
- 通知設定
- アクセス権限設定

### 2.4 プロジェクト一覧・検索
- プロジェクト一覧表示（カード/リスト形式）
- フィルタリング（ステータス、期間、メンバー）
- 検索機能
- ソート機能

### 2.5 プロジェクトダッシュボード
- プロジェクト概要
- 進捗状況
- タスク統計
- メンバー活動

## 3. データモデル

### 3.1 既存のProjectモデル拡張

```prisma
model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  status      ProjectStatus @default(PLANNING)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  isArchived  Boolean       @default(false)
  settings    Json?         // 通知設定、その他の設定
  
  // Relations
  ownerId     String
  owner       User          @relation(fields: [ownerId], references: [id])
  tasks       Task[]
  members     ProjectMember[]
  
  // Organization relation
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  
  @@map("projects")
}
```

### 3.2 ProjectMemberモデル（新規）

```prisma
model ProjectMember {
  id              String   @id @default(cuid())
  role            ProjectRole @default(MEMBER)
  resourceRate    Float    @default(100) // リソース割り当て率（%）
  joinedAt        DateTime @default(now())
  
  // Relations
  projectId       String
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([projectId, userId])
  @@map("project_members")
}

enum ProjectRole {
  PM       // Project Manager
  MEMBER   // Team Member
  VIEWER   // Read-only access
}
```

## 4. API設計

### 4.1 プロジェクトAPI

#### エンドポイント
- `GET /api/v1/projects` - プロジェクト一覧取得
- `POST /api/v1/projects` - プロジェクト作成
- `GET /api/v1/projects/:id` - プロジェクト詳細取得
- `PUT /api/v1/projects/:id` - プロジェクト更新
- `DELETE /api/v1/projects/:id` - プロジェクト削除
- `PUT /api/v1/projects/:id/archive` - プロジェクトアーカイブ
- `PUT /api/v1/projects/:id/restore` - プロジェクト復元

### 4.2 プロジェクトメンバーAPI

#### エンドポイント
- `GET /api/v1/projects/:id/members` - メンバー一覧取得
- `POST /api/v1/projects/:id/members` - メンバー追加
- `PUT /api/v1/projects/:id/members/:memberId` - メンバー情報更新
- `DELETE /api/v1/projects/:id/members/:memberId` - メンバー削除

### 4.3 プロジェクト統計API

#### エンドポイント
- `GET /api/v1/projects/:id/stats` - プロジェクト統計取得
- `GET /api/v1/projects/:id/dashboard` - ダッシュボードデータ取得

## 5. 権限管理

### 5.1 基本ルール
- プロジェクト作成：MANAGER以上
- プロジェクト参照：メンバーまたはADMIN/MANAGER
- プロジェクト更新：PMまたはADMIN
- プロジェクト削除：PMまたはADMIN
- メンバー管理：PMまたはADMIN

### 5.2 役割別権限

| 操作 | ADMIN | MANAGER | USER (PM) | USER (MEMBER) | USER (VIEWER) |
|------|-------|---------|-----------|---------------|---------------|
| プロジェクト作成 | ○ | ○ | × | × | × |
| プロジェクト参照 | ○ | ○ | ○ | ○ | ○ |
| プロジェクト更新 | ○ | × | ○ | × | × |
| プロジェクト削除 | ○ | × | ○ | × | × |
| メンバー追加 | ○ | × | ○ | × | × |
| メンバー削除 | ○ | × | ○ | × | × |
| タスク作成 | ○ | ○ | ○ | ○ | × |
| タスク更新 | ○ | ○ | ○ | ○ | × |

## 6. UI設計

### 6.1 プロジェクト一覧画面
- カード表示/リスト表示の切り替え
- フィルタリングサイドバー
- 検索バー
- ソート機能
- ページネーション

### 6.2 プロジェクト詳細画面
- 基本情報表示・編集
- メンバー一覧
- タスク一覧
- 統計情報
- アクティビティログ

### 6.3 プロジェクト作成/編集ダイアログ
- 基本情報入力
- メンバー選択
- 設定項目

## 7. 実装計画

### Phase 1: バックエンド実装（4時間）
1. Prismaスキーマの更新
2. ProjectServiceの実装
3. ProjectControllerの実装
4. ルーティング設定
5. 権限チェックの実装

### Phase 2: フロントエンド実装（4時間）
1. プロジェクト一覧画面
2. プロジェクト詳細画面
3. プロジェクト作成/編集フォーム
4. メンバー管理UI
5. APIクライアントの実装

### Phase 3: テスト・調整（2時間）
1. 動作確認
2. エラーハンドリング
3. パフォーマンス最適化
4. ドキュメント更新

## 8. 技術仕様

### 8.1 使用技術
- バックエンド：Express.js, Prisma, TypeScript
- フロントエンド：React, Material-UI, TypeScript
- 認証：JWT（既存実装を利用）
- 権限管理：RBAC（既存実装を利用）

### 8.2 パフォーマンス考慮
- プロジェクト一覧はページネーション
- メンバー情報は必要に応じて遅延読み込み
- 統計情報はキャッシュを活用

### 8.3 セキュリティ
- すべてのAPIエンドポイントで認証必須
- 権限チェックの徹底
- SQLインジェクション対策（Prisma使用）
- XSS対策（React使用）