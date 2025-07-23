# CCPM アルゴリズム調査レポート

## 1. CCPM（Critical Chain Project Management）概要

### 1.1 基本概念
- **クリティカルチェーン**: プロジェクト完了までの最長のタスク連鎖（リソース制約を考慮）
- **バッファ管理**: 不確実性への対処としてバッファを集約管理
- **TOC（Theory of Constraints）**: 制約理論に基づくプロジェクト管理手法

### 1.2 従来のCPM（Critical Path Method）との違い
| 項目 | CPM | CCPM |
|------|-----|------|
| リソース考慮 | なし | あり |
| 安全余裕 | 各タスクに分散 | バッファとして集約 |
| タスク見積もり | 90%確率 | 50%確率 |
| 進捗管理 | タスク単位 | バッファ消費率 |

## 2. クリティカルチェーン算出アルゴリズム

### 2.1 基本アルゴリズム手順
1. **CPM計算**: まずリソース制約を無視してクリティカルパスを算出
2. **リソースレベリング**: リソース競合を解消
3. **クリティカルチェーン特定**: リソース制約後の最長パス
4. **バッファ配置**: プロジェクトバッファとフィーディングバッファを配置

### 2.2 フォワードパス・バックワードパス計算
```
フォワードパス（最早開始時刻計算）:
ES[i] = max(ES[j] + Duration[j]) for all j in predecessors(i)
EF[i] = ES[i] + Duration[i]

バックワードパス（最遅開始時刻計算）:
LF[i] = min(LS[j]) for all j in successors(i)
LS[i] = LF[i] - Duration[i]

スラック計算:
Slack[i] = LS[i] - ES[i] = LF[i] - EF[i]
```

### 2.3 リソース競合解消アルゴリズム
```python
def resolve_resource_conflicts(tasks):
    # 1. タスクを最早開始時刻でソート
    sorted_tasks = sort_by_early_start(tasks)
    
    # 2. リソース使用状況を追跡
    resource_usage = {}
    
    # 3. 各タスクについて
    for task in sorted_tasks:
        # リソース競合をチェック
        if has_resource_conflict(task, resource_usage):
            # 競合解消のため開始時刻を調整
            adjust_start_time(task, resource_usage)
        
        # リソース使用を記録
        update_resource_usage(task, resource_usage)
```

## 3. バッファサイジング手法

### 3.1 Cut and Paste法
- 各タスクの安全余裕（50%）をカット
- プロジェクト終端にペースト
- 単純だが効果的

### 3.2 Root Sum of Squares（RSS）法
```
Buffer Size = sqrt(Σ(σi²))
where σi = タスクiの標準偏差（通常は期間の25-50%）
```

### 3.3 Adaptive Procedure with Density（APD）法
```
Buffer Size = K × sqrt(Σ(Di²))
where:
- K = 複雑度係数（1.0-2.0）
- Di = タスクiの期間
```

## 4. フィーバーチャート管理

### 4.1 ゾーン定義
- **グリーンゾーン**: バッファ消費率 < 進捗率 × 0.8
- **イエローゾーン**: 進捗率 × 0.8 ≤ バッファ消費率 ≤ 進捗率 × 1.2
- **レッドゾーン**: バッファ消費率 > 進捗率 × 1.2

### 4.2 管理アクション
| ゾーン | 状態 | 推奨アクション |
|--------|------|----------------|
| グリーン | 順調 | 監視継続 |
| イエロー | 注意 | 原因分析、予防措置 |
| レッド | 危険 | 即座の是正措置、リカバリープラン |

## 5. バッファトレンドグラフ

### 5.1 グラフの見方
- **X軸**: プロジェクト進捗率（0-100%）
- **Y軸**: バッファ消費率（0-100%）
- **理想線**: 対角線（進捗とバッファ消費が比例）

### 5.2 トレンド分析
- **理想線より下**: バッファ消費が少ない（順調）
- **理想線に沿う**: 計画通りの進行
- **理想線より上**: バッファ消費が多い（要注意）

## 6. 実装上の考慮事項

### 6.1 アルゴリズム最適化
1. **メモ化**: 計算結果のキャッシュ
2. **インクリメンタル計算**: 部分的な変更時の効率的な再計算
3. **並列処理**: 独立したサブグラフの並列計算

### 6.2 実用的な拡張
1. **マルチプロジェクト対応**: リソースプール共有
2. **確率的シミュレーション**: モンテカルロ法による精度向上
3. **学習機能**: 過去のプロジェクトデータからの見積もり改善

### 6.3 UI/UX考慮事項
1. **リアルタイム更新**: タスク変更時の即座の反映
2. **What-if分析**: シナリオ比較機能
3. **アラート機能**: バッファ消費の閾値超過時の通知

## 7. 参考実装パターン

### 7.1 クリティカルチェーン計算の疑似コード
```typescript
function calculateCriticalChain(tasks: Task[]): Task[] {
  // 1. トポロジカルソート
  const sortedTasks = topologicalSort(tasks);
  
  // 2. フォワードパス
  for (const task of sortedTasks) {
    task.earlyStart = calculateEarlyStart(task);
    task.earlyFinish = task.earlyStart + task.duration;
  }
  
  // 3. バックワードパス
  for (const task of sortedTasks.reverse()) {
    task.lateFinish = calculateLateFinish(task);
    task.lateStart = task.lateFinish - task.duration;
  }
  
  // 4. クリティカルタスク特定
  const criticalTasks = tasks.filter(task => 
    task.earlyStart === task.lateStart
  );
  
  // 5. リソース制約適用
  const resourceLeveledTasks = applyResourceConstraints(criticalTasks);
  
  return resourceLeveledTasks;
}
```

### 7.2 バッファ計算の実装例
```typescript
function calculateProjectBuffer(criticalChain: Task[]): number {
  // RSS法によるバッファ計算
  const variances = criticalChain.map(task => {
    const safetyMargin = task.duration * 0.5; // 50%の安全余裕
    return Math.pow(safetyMargin, 2);
  });
  
  const totalVariance = variances.reduce((sum, v) => sum + v, 0);
  return Math.sqrt(totalVariance);
}
```

## 8. まとめ

CCPMアルゴリズムの実装には以下が重要：

1. **正確なクリティカルチェーン計算**: CPMベースにリソース制約を追加
2. **適切なバッファサイジング**: プロジェクト特性に応じた手法選択
3. **効果的なモニタリング**: フィーバーチャートとバッファトレンドの活用
4. **パフォーマンス最適化**: 大規模プロジェクトでの計算効率

これらの要素を考慮した詳細設計により、実用的なCCPMシステムの構築が可能となる。