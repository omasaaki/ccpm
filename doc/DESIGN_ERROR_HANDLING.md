# エラー処理設計書 - CCPM システム

## 1. 設計概要

### 1.1 設計目標
- **可用性向上**: 障害発生時の迅速な復旧
- **保守性向上**: 効率的なトラブルシューティング
- **ユーザビリティ向上**: 分かりやすいエラーメッセージ
- **監視性向上**: 問題の早期発見と対応

### 1.2 設計原則
- **Fail Fast**: 問題を早期に検出し、適切にハンドリング
- **Graceful Degradation**: 部分的な機能停止でもサービス継続
- **透明性**: エラーの原因と対処法を明確に
- **一貫性**: システム全体で統一されたエラー処理

## 2. エラー分類体系

### 2.1 エラーカテゴリ

#### A. ビジネスロジックエラー (4xx)
```typescript
enum BusinessErrorCode {
  // 認証・認可エラー
  AUTH_REQUIRED = 'AUTH_001',           // 認証が必要
  AUTH_INVALID = 'AUTH_002',            // 認証情報が無効
  ACCESS_DENIED = 'AUTH_003',           // アクセス権限なし
  
  // バリデーションエラー
  VALIDATION_ERROR = 'VAL_001',         // 入力検証エラー
  REQUIRED_FIELD = 'VAL_002',           // 必須項目未入力
  INVALID_FORMAT = 'VAL_003',           // フォーマット不正
  OUT_OF_RANGE = 'VAL_004',             // 範囲外の値
  
  // リソースエラー
  RESOURCE_NOT_FOUND = 'RES_001',       // リソース未発見
  RESOURCE_CONFLICT = 'RES_002',        // リソース競合
  RESOURCE_LOCKED = 'RES_003',          // リソースロック中
  
  // CCPM固有エラー
  CIRCULAR_DEPENDENCY = 'CCPM_001',     // 循環依存関係
  INVALID_CRITICAL_CHAIN = 'CCPM_002',  // 不正なクリティカルチェーン
  BUFFER_OVERFLOW = 'CCPM_003',         // バッファ消費超過
  CALCULATION_FAILED = 'CCPM_004',      // CCPM計算失敗
  
  // プロジェクト管理エラー
  PROJECT_NOT_ACTIVE = 'PROJ_001',      // プロジェクト非アクティブ
  TASK_DATE_CONFLICT = 'PROJ_002',      // タスク日付競合
  MILESTONE_VIOLATION = 'PROJ_003',     // マイルストーン違反
}
```

#### B. システムエラー (5xx)
```typescript
enum SystemErrorCode {
  // データベースエラー
  DB_CONNECTION_FAILED = 'DB_001',      // DB接続失敗
  DB_QUERY_TIMEOUT = 'DB_002',          // クエリタイムアウト
  DB_CONSTRAINT_VIOLATION = 'DB_003',   // 制約違反
  DB_TRANSACTION_FAILED = 'DB_004',     // トランザクション失敗
  
  // 外部サービスエラー
  EXTERNAL_API_UNAVAILABLE = 'EXT_001', // 外部API利用不可
  EXTERNAL_API_TIMEOUT = 'EXT_002',     // 外部APIタイムアウト
  EXTERNAL_API_RATE_LIMIT = 'EXT_003',  // レート制限
  
  // インフラエラー
  MEMORY_EXHAUSTED = 'SYS_001',         // メモリ不足
  DISK_SPACE_FULL = 'SYS_002',          // ディスク容量不足
  SERVICE_UNAVAILABLE = 'SYS_003',      // サービス利用不可
  
  // 設定エラー
  CONFIG_MISSING = 'CFG_001',           // 設定項目不足
  CONFIG_INVALID = 'CFG_002',           // 設定値不正
}
```

### 2.2 エラー重要度レベル
```typescript
enum ErrorSeverity {
  CRITICAL = 'critical',    // システム停止、即座の対応が必要
  ERROR = 'error',          // 機能停止、早急な対応が必要  
  WARNING = 'warning',      // 部分的な問題、監視が必要
  INFO = 'info',            // 情報提供、記録のみ
}
```

## 3. エラーハンドリングパターン

### 3.1 バックエンドエラーハンドリング

#### 3.1.1 エラークラス階層
```typescript
// ベースエラークラス
abstract class CCPMError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly httpStatus: number;
  public readonly isOperational: boolean;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly correlationId: string;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    httpStatus: number,
    context: Record<string, any> = {},
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.severity = severity;
    this.httpStatus = httpStatus;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    this.correlationId = generateCorrelationId();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// ビジネスロジックエラー
class BusinessError extends CCPMError {
  constructor(code: BusinessErrorCode, message: string, context?: Record<string, any>) {
    super(message, code, ErrorSeverity.ERROR, 422, context);
  }
}

// システムエラー
class SystemError extends CCPMError {
  constructor(code: SystemErrorCode, message: string, context?: Record<string, any>) {
    super(message, code, ErrorSeverity.CRITICAL, 500, context, false);
  }
}

// CCPM固有エラー
class CCPMCalculationError extends BusinessError {
  constructor(message: string, calculationContext: any) {
    super(BusinessErrorCode.CALCULATION_FAILED, message, {
      calculation: calculationContext
    });
  }
}
```

#### 3.1.2 グローバルエラーハンドラー
```typescript
class GlobalErrorHandler {
  private logger: Logger;
  private notificationService: NotificationService;

  constructor(logger: Logger, notificationService: NotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
  }

  public handleError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
    
    // ログ出力
    this.logError(error, req, correlationId);
    
    // アラート送信（重要度による判定）
    if (this.shouldAlert(error)) {
      this.sendAlert(error, correlationId);
    }
    
    // レスポンス生成
    if (error instanceof CCPMError && error.isOperational) {
      this.sendErrorResponse(res, error, correlationId);
    } else {
      this.sendGenericErrorResponse(res, correlationId);
    }
  }

  private logError(error: Error, req: Request, correlationId: string): void {
    const logContext = {
      correlationId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof CCPMError && {
          code: error.code,
          severity: error.severity,
          context: error.context
        })
      },
      request: {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        userId: req.user?.id
      }
    };

    if (error instanceof CCPMError) {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          this.logger.error('Critical error occurred', logContext);
          break;
        case ErrorSeverity.ERROR:
          this.logger.error('Error occurred', logContext);
          break;
        case ErrorSeverity.WARNING:
          this.logger.warn('Warning occurred', logContext);
          break;
        default:
          this.logger.info('Info logged', logContext);
      }
    } else {
      this.logger.error('Unexpected error occurred', logContext);
    }
  }

  private shouldAlert(error: Error): boolean {
    if (error instanceof CCPMError) {
      return error.severity === ErrorSeverity.CRITICAL || 
             error.severity === ErrorSeverity.ERROR;
    }
    return true; // 予期しないエラーは常にアラート
  }

  private sendErrorResponse(res: Response, error: CCPMError, correlationId: string): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp.toISOString(),
        correlationId,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context
        })
      }
    };

    res.status(error.httpStatus).json(response);
  }

  private sendGenericErrorResponse(res: Response, correlationId: string): void {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '内部サーバーエラーが発生しました',
        severity: ErrorSeverity.CRITICAL,
        timestamp: new Date().toISOString(),
        correlationId
      }
    });
  }
}
```

### 3.2 フロントエンドエラーハンドリング

#### 3.2.1 Reactエラーバウンダリ
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  correlationId?: string;
}

class CCPMErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      correlationId: generateCorrelationId()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // エラーレポート送信
    errorReportingService.reportError({
      error,
      errorInfo,
      correlationId: this.state.correlationId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          correlationId={this.state.correlationId}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

#### 3.2.2 APIエラーハンドリング
```typescript
class ApiErrorHandler {
  public static handleApiError(error: AxiosError): never {
    const correlationId = error.response?.headers['x-correlation-id'] || generateCorrelationId();
    
    if (error.response) {
      const { status, data } = error.response;
      const errorData = data as ErrorResponse;
      
      switch (status) {
        case 401:
          this.handleAuthenticationError(errorData, correlationId);
          break;
        case 403:
          this.handleAuthorizationError(errorData, correlationId);
          break;
        case 422:
          this.handleValidationError(errorData, correlationId);
          break;
        case 500:
          this.handleSystemError(errorData, correlationId);
          break;
        default:
          this.handleGenericError(errorData, correlationId);
      }
    } else if (error.request) {
      this.handleNetworkError(correlationId);
    } else {
      this.handleRequestSetupError(error, correlationId);
    }
    
    throw new ClientError(error.message, correlationId);
  }

  private static handleAuthenticationError(errorData: ErrorResponse, correlationId: string): void {
    toast.error('セッションの有効期限が切れました。再度ログインしてください。');
    authService.logout();
    window.location.href = '/login';
  }

  private static handleValidationError(errorData: ErrorResponse, correlationId: string): void {
    const message = errorData.error.message || ' 入力内容にエラーがあります';
    toast.error(message);
    throw new ValidationError(message, errorData.error.context);
  }
}
```

## 4. ログ出力仕様

### 4.1 ログレベル定義
```typescript
enum LogLevel {
  TRACE = 'trace',    // 詳細なデバッグ情報
  DEBUG = 'debug',    // デバッグ情報
  INFO = 'info',      // 一般的な情報
  WARN = 'warn',      // 警告
  ERROR = 'error',    // エラー
  FATAL = 'fatal',    // 致命的エラー
}
```

### 4.2 ログフォーマット
```typescript
interface LogEntry {
  timestamp: string;           // ISO 8601形式
  level: LogLevel;            // ログレベル
  message: string;            // ログメッセージ
  correlationId: string;      // リクエスト追跡ID
  service: string;            // サービス名
  version: string;            // アプリケーションバージョン
  environment: string;        // 環境名
  userId?: string;            // ユーザーID
  sessionId?: string;         // セッションID
  requestId?: string;         // リクエストID
  module: string;             // モジュール名
  function?: string;          // 関数名
  context?: Record<string, any>; // 追加コンテキスト
  error?: {                   // エラー情報
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {             // パフォーマンス情報
    duration: number;         // 処理時間（ms）
    memoryUsage?: number;     // メモリ使用量
  };
}
```

### 4.3 ログ出力設定
```typescript
const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: [
    // コンソール出力
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // ファイル出力
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // 全レベルファイル出力
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
};
```

## 5. リトライ機構設計

### 5.1 リトライ戦略

#### 5.1.1 指数バックオフ
```typescript
interface RetryConfig {
  maxAttempts: number;        // 最大試行回数
  baseDelay: number;          // 基本遅延時間（ms）
  maxDelay: number;           // 最大遅延時間（ms）
  backoffMultiplier: number;  // バックオフ倍率
  jitter: boolean;            // ジッター追加
}

class ExponentialBackoffRetry {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>, retryableErrors: string[] = []): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // リトライ対象エラーかチェック
        if (!this.shouldRetry(error, retryableErrors, attempt)) {
          throw error;
        }
        
        // 最終試行時はリトライしない
        if (attempt === this.config.maxAttempts) {
          break;
        }
        
        // 遅延時間計算と待機
        const delay = this.calculateDelay(attempt);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  private shouldRetry(error: Error, retryableErrors: string[], attempt: number): boolean {
    // システムエラーはリトライ対象
    if (error instanceof SystemError) {
      return retryableErrors.length === 0 || retryableErrors.includes(error.code);
    }
    
    // ビジネスエラーは基本的にリトライしない
    return false;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * 
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    let delay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // ジッター追加（thundering herd問題を回避）
    if (this.config.jitter) {
      delay = delay + (Math.random() * delay * 0.1);
    }
    
    return delay;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 5.1.2 サーキットブレーカー
```typescript
enum CircuitState {
  CLOSED = 'closed',      // 正常状態
  OPEN = 'open',          // 遮断状態
  HALF_OPEN = 'half_open' // 半開状態
}

interface CircuitBreakerConfig {
  failureThreshold: number;    // 失敗閾値
  recoveryTimeout: number;     // 復旧タイムアウト（ms）
  monitoringPeriod: number;    // 監視期間（ms）
  halfOpenMaxCalls: number;    // 半開状態での最大呼び出し数
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenCalls: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCalls = 0;
      } else {
        throw new SystemError(
          SystemErrorCode.SERVICE_UNAVAILABLE,
          'サービスが一時的に利用できません（サーキットブレーカー作動中）'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

### 5.2 リトライ適用例
```typescript
// CCPM計算のリトライ
class CCPMServiceWithRetry {
  private retryHandler: ExponentialBackoffRetry;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.retryHandler = new ExponentialBackoffRetry({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
      halfOpenMaxCalls: 3
    });
  }

  async calculateCriticalChain(projectId: string): Promise<CriticalChain> {
    return this.circuitBreaker.execute(() =>
      this.retryHandler.execute(
        () => this.performCalculation(projectId),
        [SystemErrorCode.DB_QUERY_TIMEOUT, SystemErrorCode.EXTERNAL_API_TIMEOUT]
      )
    );
  }
}
```

## 6. アラート・通知設計

### 6.1 アラート分類
```typescript
enum AlertType {
  SYSTEM_DOWN = 'system_down',              // システム停止
  HIGH_ERROR_RATE = 'high_error_rate',      // エラー率上昇
  PERFORMANCE_DEGRADATION = 'perf_degraded', // パフォーマンス劣化
  RESOURCE_EXHAUSTION = 'resource_exhausted', // リソース枯渇
  SECURITY_INCIDENT = 'security_incident',   // セキュリティインシデント
  BUSINESS_RULE_VIOLATION = 'business_violation' // ビジネスルール違反
}

interface AlertRule {
  type: AlertType;
  condition: string;          // アラート条件
  threshold: number;          // 閾値
  duration: number;           // 継続時間（秒）
  severity: ErrorSeverity;    // 重要度
  channels: string[];         // 通知チャネル
  tags: string[];            // タグ
}
```

### 6.2 アラートルール定義
```typescript
const alertRules: AlertRule[] = [
  {
    type: AlertType.SYSTEM_DOWN,
    condition: 'http_requests_total{status="5xx"} > 10',
    threshold: 10,
    duration: 60,
    severity: ErrorSeverity.CRITICAL,
    channels: ['slack', 'email', 'sms'],
    tags: ['critical', 'system']
  },
  {
    type: AlertType.HIGH_ERROR_RATE,
    condition: 'rate(errors_total[5m]) > 0.05',
    threshold: 0.05,
    duration: 300,
    severity: ErrorSeverity.ERROR,
    channels: ['slack', 'email'],
    tags: ['error_rate']
  },
  {
    type: AlertType.PERFORMANCE_DEGRADATION,
    condition: 'http_request_duration_seconds{quantile="0.95"} > 2',
    threshold: 2,
    duration: 300,
    severity: ErrorSeverity.WARNING,
    channels: ['slack'],
    tags: ['performance']
  }
];
```

### 6.3 通知サービス
```typescript
interface NotificationChannel {
  send(alert: Alert): Promise<void>;
}

class SlackNotification implements NotificationChannel {
  async send(alert: Alert): Promise<void> {
    const payload = {
      text: `🚨 ${alert.title}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'エラーコード', value: alert.errorCode, short: true },
          { title: '発生時刻', value: alert.timestamp, short: true },
          { title: '詳細', value: alert.description, short: false },
          { title: '相関ID', value: alert.correlationId, short: true }
        ]
      }]
    };

    await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
  }

  private getSeverityColor(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'danger';
      case ErrorSeverity.ERROR: return 'warning';
      case ErrorSeverity.WARNING: return '#ffcc00';
      default: return 'good';
    }
  }
}

class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();

  constructor() {
    this.channels.set('slack', new SlackNotification());
    this.channels.set('email', new EmailNotification());
    this.channels.set('sms', new SMSNotification());
  }

  async sendAlert(alert: Alert, channelNames: string[]): Promise<void> {
    const promises = channelNames.map(async (channelName) => {
      const channel = this.channels.get(channelName);
      if (channel) {
        try {
          await channel.send(alert);
        } catch (error) {
          console.error(`Failed to send alert to ${channelName}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }
}
```

## 7. モニタリング設計

### 7.1 メトリクス定義
```typescript
// Prometheusメトリクス例
const metrics = {
  // HTTPリクエスト
  httpRequestsTotal: new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  httpRequestDuration: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  }),

  // CCPM固有メトリクス
  ccpmCalculationsTotal: new promClient.Counter({
    name: 'ccpm_calculations_total',
    help: 'Total number of CCPM calculations',
    labelNames: ['project_id', 'status']
  }),

  ccpmCalculationDuration: new promClient.Histogram({
    name: 'ccpm_calculation_duration_seconds',
    help: 'CCPM calculation duration in seconds',
    labelNames: ['project_id'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60]
  }),

  // エラーメトリクス
  errorsTotal: new promClient.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['error_code', 'severity']
  })
};
```

### 7.2 ヘルスチェックエンドポイント
```typescript
interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  timeout: number;
}

class HealthCheckService {
  private checks: HealthCheck[] = [];

  addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const results: HealthCheckDetail[] = [];
    let overallStatus = 'healthy';

    for (const check of this.checks) {
      try {
        const startTime = Date.now();
        const isHealthy = await Promise.race([
          check.check(),
          this.timeout(check.timeout)
        ]);
        const duration = Date.now() - startTime;

        results.push({
          name: check.name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          duration,
          timestamp: new Date().toISOString()
        });

        if (!isHealthy) {
          overallStatus = 'degraded';
        }
      } catch (error) {
        results.push({
          name: check.name,
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), ms)
    );
  }
}

// ヘルスチェック登録例
const healthService = new HealthCheckService();

healthService.addCheck({
  name: 'database',
  check: async () => {
    const result = await prisma.$queryRaw`SELECT 1`;
    return result !== null;
  },
  timeout: 5000
});

healthService.addCheck({
  name: 'redis',
  check: async () => {
    await redis.ping();
    return true;
  },
  timeout: 3000
});
```

## 8. 運用手順書

### 8.1 エラー対応フロー

#### 8.1.1 Critical エラー対応
1. **即座のアラート受信**
2. **システム状況確認**
   - ダッシュボードでメトリクス確認
   - ログでエラー詳細確認
3. **影響範囲の特定**
   - 影響ユーザー数
   - 機能停止範囲
4. **緊急対応**
   - サービス再起動
   - トラフィック制限
   - フェイルオーバー実行
5. **復旧確認とフォローアップ**

#### 8.1.2 Error エラー対応
1. **アラート受信**
2. **ログ分析**
3. **根本原因調査**
4. **修正計画策定**
5. **修正実施と検証**

### 8.2 ログ分析手順
```bash
# エラーログの検索
grep "ERROR" /var/log/ccpm/error.log | tail -100

# 特定のエラーコードで検索
grep "CCPM_001" /var/log/ccpm/combined.log

# 相関IDによる追跡
grep "correlation-id-12345" /var/log/ccpm/combined.log

# JSON形式ログの解析
cat /var/log/ccpm/combined.log | jq '.[] | select(.level=="ERROR")'
```

## 更新履歴

| 日付 | 版数 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2025-01-22 | 1.0 | 初版作成（エラー処理設計完成） | - |