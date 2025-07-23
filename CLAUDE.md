# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCPM (Critical Chain Project Management)のタスク管理を行うWebアプリケーションの開発プロジェクトです。

このプロジェクトは現在計画フェーズにあり、チケット駆動開発（TiD）を採用して厳格なプロジェクト管理を行っています。

## Critical Project Rules

### 最優先ルール
1. **必ず確認を取る**: ファイル生成・更新・プログラム実行前に必ず作業計画を報告してy/nで確認を求める
2. **日本語で対話**: 会話とドキュメントは全て日本語、プログラムのコメントのみ英語
3. **ルールの厳守**: 指示や計画を勝手に変更しない（変更が必要な場合は理由を説明し新しい計画を提案）

### プロジェクト管理体系
このプロジェクトは以下のルールドキュメントに従って管理されています：
- `project_management/project_management_rule.md` - 基本的なプロジェクト管理ルール
- `project_management/tid.md` - チケット駆動開発プロセス
- `project_management/work_rule.md` - 作業ルール
- `project_management/dev_rule.md` - 開発プロジェクトルール
- `project_management/document_rule.md` - ドキュメント作成ルール

## Ticket-Driven Development (TiD)

### チケット管理
- **全ての作業はチケットベース**: 作業はチケット化して管理
- **チケットID**: `CCPM-001` 形式（プロジェクトプレフィックス-番号）
- **ステータス遷移**: TODO → IN_PROGRESS → REVIEW → DONE
- **優先度**: High/Middle/Low
- **トラッカー**: 機能/要望/バグ/作業/改善

### チケット作業フロー
1. チケット着手時は必ず作業計画を立てて確認を取る
2. ステータスを更新し、作業時間を記録
3. 作業完了後はREVIEWステータスへ変更
4. 次に取り組むべきチケットを提案

## Development Workflow (開発が始まったら)

### 開発フロー
1. **設計**: アーキテクチャ設計 → 詳細設計
2. **テストファースト**: テストコード作成 → 実装
3. **品質チェック**: セルフレビュー → 静的解析
4. **テスト実行**: テスト実行 → カバレッジ確認（80%以上）

### コード規約
- 既存のコード規約に従う
- コメントは英語で記述
- エラーハンドリングを適切に実装
- セキュリティとパフォーマンスを考慮

## Directory Structure

```
ccpm/
├── CLAUDE.md                       # このファイル
├── CHANGELOG                       # 作業記録
├── project_management/             # プロジェクト管理
│   ├── *.md                        # 各種ルールドキュメント
│   ├── tickets.md                  # チケット一覧管理
│   └── tickets/                    # 個別チケット詳細
│       └── CCPM-XXX.md
├── doc/                            # 設計ドキュメント（開発開始後）
│   ├── DESIGN_*.md                 # 設計書
│   ├── REQUIREMENTS_DEFINITION.md  # 要件定義書
│   ├── uml/                        # PlantUMLソース
│   └── images/                     # 生成された図
└── src/                            # ソースコード（開発開始後）
```

## Important Reminders

### 確認が必要な作業
- 設計変更（アーキテクチャへの影響）
- 新技術の導入（ライブラリ、フレームワーク）
- データベース変更
- API変更（破壊的変更）
- セキュリティ関連の変更
- 4時間を超える実装作業

### 確認不要な作業
- ファイルの読込・検索
- tickets.mdとtickets/ディレクトリの更新

## Work Recording

作業内容はCHANGELOGファイルに記録します。

## Future Development Commands

開発が始まったら、以下のコマンドセクションを追加してください：
```
## Common Commands

### Build
# プロジェクトに応じて追加

### Test
# プロジェクトに応じて追加

### Lint & Type Check
# プロジェクトに応じて追加
```