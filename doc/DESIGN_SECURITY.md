# セキュリティ設計書 - CCPM システム

## 1. セキュリティ設計概要

### 1.1 設計方針
- **多層防御アプローチ**: 複数のセキュリティ対策を組み合わせ
- **最小権限の原則**: 必要最小限のアクセス権限のみ付与
- **ゼロトラスト**: すべてのアクセスを検証・認証
- **セキュアバイデザイン**: 設計段階からセキュリティを考慮
- **OWASP準拠**: 業界標準のセキュリティベストプラクティスに従う

### 1.2 脅威モデル
**PlantUMLファイル**: `doc/uml/security_threat_model.puml`

![脅威モデル図](images/security_threat_model.png)

以下の脅威からシステムを保護する：
- **外部攻撃**: 未認証の悪意あるアクセス
- **内部脅威**: 権限の悪用・データの不正取得
- **データ漏洩**: 機密情報の外部流出
- **サービス停止**: DDoS攻撃・システム障害
- **データ改ざん**: 不正なデータ変更・削除

### 1.3 セキュリティアーキテクチャ
**PlantUMLファイル**: `doc/uml/security_architecture.puml`

![セキュリティアーキテクチャ図](images/security_architecture.png)

## 2. 認証・認可設計

### 2.1 認証アーキテクチャ
**認証方式**: JWT (JSON Web Token) ベース認証

```typescript
// JWT トークン構造
interface JWTPayload {
  sub: string;        // ユーザーID (UUID)
  user_id: string;    // ログインID
  role: UserRole;     // ユーザーロール
  permissions: string[]; // 権限リスト
  iat: number;        // 発行時刻
  exp: number;        // 有効期限
  iss: string;        // 発行者
  aud: string;        // 対象サービス
}
```

**トークン設定**:
- **アクセストークン有効期限**: 15分
- **リフレッシュトークン有効期限**: 7日
- **署名アルゴリズム**: RS256 (RSA with SHA-256)
- **キーローテーション**: 30日間隔

### 2.2 ロールベースアクセス制御 (RBAC)

#### 2.2.1 ロール定義
```typescript
enum UserRole {
  ADMIN = 'ADMIN',           // システム管理者
  PROJECT_MANAGER = 'PM',    // プロジェクト管理者
  TEAM_LEADER = 'TL',        // チームリーダー
  USER = 'USER'              // 一般ユーザー
}
```

#### 2.2.2 権限マトリックス
| リソース | ADMIN | PM | TL | USER |
|----------|-------|----|----|------|
| ユーザー管理 | CRUD | R | R | R（自分のみ） |
| プロジェクト管理 | CRUD | CRUD | RU | R |
| タスク管理 | CRUD | CRUD | CRUD | RU（担当分） |
| レポート | CRUD | CRUD | R | R |
| システム設定 | CRUD | - | - | - |

#### 2.2.3 権限チェック実装
```typescript
// 権限チェックミドルウェア
const checkPermission = (resource: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const permissions = getPermissions(userRole);
    
    if (!hasPermission(permissions, resource, action)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};

// 使用例
router.delete('/projects/:id', 
  authenticateToken,
  checkPermission('project', 'delete'),
  deleteProject
);
```

### 2.3 多要素認証 (MFA)
**段階的導入計画**:
1. **フェーズ1**: パスワード + SMS認証
2. **フェーズ2**: TOTP (Time-based One-Time Password) 対応
3. **フェーズ3**: WebAuthn/FIDO2 対応

## 3. データ保護設計

### 3.1 保存時暗号化

#### 3.1.1 データベース暗号化
```sql
-- PostgreSQL Transparent Data Encryption (TDE)
-- パスワードの暗号化
CREATE TABLE users (
    id UUID PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- bcrypt hash
    encryption_key_id INTEGER,    -- キーローテーション用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.2 機密データ暗号化
```typescript
// AES-256-GCM による機密データ暗号化
import crypto from 'crypto';

class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  
  static encrypt(data: string, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('ccpm-system'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
}
```

### 3.2 転送時暗号化

#### 3.2.1 HTTPS設定
```nginx
# Nginx SSL設定
server {
    listen 443 ssl http2;
    server_name ccpm.example.com;
    
    # SSL証明書
    ssl_certificate /etc/letsencrypt/live/ccpm.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ccpm.example.com/privkey.pem;
    
    # SSL設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # セキュリティヘッダー
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

#### 3.2.2 API通信暗号化
```typescript
// リクエスト暗号化ミドルウェア
const encryptedAPI = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-encoding'] === 'encrypted') {
    try {
      const decryptedBody = await decrypt(req.body);
      req.body = JSON.parse(decryptedBody);
    } catch (error) {
      throw new BadRequestError('Invalid encrypted payload');
    }
  }
  next();
};
```

## 4. 入力検証・サニタイゼーション

### 4.1 SQL インジェクション対策

#### 4.1.1 Prisma ORM活用
```typescript
// 安全なデータベースクエリ（Prisma）
const getUserProjects = async (userId: string, search?: string) => {
  return await prisma.project.findMany({
    where: {
      members: {
        some: {
          user_id: userId  // パラメータ化クエリ
        }
      },
      ...(search && {
        name: {
          contains: search,  // 自動エスケープ
          mode: 'insensitive'
        }
      })
    },
    include: {
      members: true,
      tasks: true
    }
  });
};
```

#### 4.1.2 入力値検証
```typescript
import Joi from 'joi';

// バリデーションスキーマ
const projectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  members: Joi.array().items(Joi.string().uuid()).min(1).required()
});

// バリデーションミドルウェア
const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    req.body = value;
    next();
  };
};
```

### 4.2 XSS (Cross-Site Scripting) 対策

#### 4.2.1 出力エスケープ
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// サーバーサイドHTML Sanitization
const sanitizeHTML = (dirty: string): string => {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
};

// APIレスポンス出力時のサニタイゼーション
const sanitizeResponse = (data: any): any => {
  if (typeof data === 'string') {
    return sanitizeHTML(data);
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeResponse);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeResponse(value);
    }
    return sanitized;
  }
  return data;
};
```

#### 4.2.2 Content Security Policy (CSP)
```typescript
// CSPヘッダー設定
const cspMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; '));
  next();
};
```

## 5. API セキュリティ

### 5.1 レート制限
```typescript
import rateLimit from 'express-rate-limit';

// 一般的なAPI制限
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 1000, // リクエスト数制限
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// ログインAPI制限
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15分間で5回まで
  skipSuccessfulRequests: true,
  message: 'Too many login attempts'
});

// パスワードリセット制限
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 3, // 1時間で3回まで
  message: 'Too many password reset attempts'
});
```

### 5.2 CORS設定
```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'https://ccpm.example.com',
      'https://staging.ccpm.example.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### 5.3 APIキー管理
```typescript
// APIキー検証ミドルウェア
const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    throw new UnauthorizedError('API key required');
  }
  
  // Redis でAPIキー検証
  const isValidKey = await redis.exists(`api_key:${apiKey}`);
  if (!isValidKey) {
    throw new UnauthorizedError('Invalid API key');
  }
  
  next();
};
```

## 6. セキュリティモニタリング

### 6.1 セキュリティログ
```typescript
import winston from 'winston';

// セキュリティイベントログ
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ccpm-security' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/ccpm/security.log',
      level: 'warn'
    }),
    new winston.transports.Console()
  ]
});

// セキュリティイベント記録
const logSecurityEvent = (event: SecurityEvent) => {
  securityLogger.warn('Security Event', {
    event_type: event.type,
    user_id: event.userId,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    details: event.details,
    timestamp: new Date().toISOString()
  });
};

// 使用例
app.use((req: Request, res: Response, next: NextFunction) => {
  // 不審なリクエストの検出
  if (detectSuspiciousActivity(req)) {
    logSecurityEvent({
      type: 'SUSPICIOUS_REQUEST',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { url: req.url, method: req.method }
    });
  }
  next();
});
```

### 6.2 侵入検知システム (IDS)
```typescript
// 異常検知ルール
const securityRules = {
  // 短時間での大量リクエスト
  rapidRequests: {
    threshold: 100,
    timeWindow: 60000, // 1分
    action: 'BLOCK_IP'
  },
  
  // SQLインジェクション試行
  sqlInjectionAttempt: {
    patterns: [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i
    ],
    action: 'LOG_AND_BLOCK'
  },
  
  // 権限昇格試行
  privilegeEscalation: {
    threshold: 5,
    timeWindow: 300000, // 5分
    action: 'ALERT_ADMIN'
  }
};

// リアルタイム監視
const monitorSecurity = async (req: Request) => {
  const clientIP = req.ip;
  const requestCount = await redis.incr(`requests:${clientIP}`);
  
  if (requestCount === 1) {
    await redis.expire(`requests:${clientIP}`, 60);
  }
  
  if (requestCount > securityRules.rapidRequests.threshold) {
    await blockIP(clientIP, 'Rapid requests detected');
    throw new TooManyRequestsError('Rate limit exceeded');
  }
};
```

### 6.3 インシデント対応
```typescript
// インシデント自動対応
class SecurityIncidentHandler {
  static async handleIncident(incident: SecurityIncident) {
    switch (incident.severity) {
      case 'CRITICAL':
        await this.criticalIncidentResponse(incident);
        break;
      case 'HIGH':
        await this.highIncidentResponse(incident);
        break;
      case 'MEDIUM':
        await this.mediumIncidentResponse(incident);
        break;
    }
  }
  
  private static async criticalIncidentResponse(incident: SecurityIncident) {
    // 1. 管理者への即座通知
    await notificationService.sendUrgentAlert({
      to: ['admin@example.com', 'security@example.com'],
      subject: 'CRITICAL Security Incident',
      message: `Critical security incident detected: ${incident.description}`
    });
    
    // 2. 該当IPの即座ブロック
    if (incident.sourceIP) {
      await blockIP(incident.sourceIP, incident.description);
    }
    
    // 3. セキュリティログの強化
    await enableVerboseLogging(incident.affectedServices);
  }
}
```

## 7. 脆弱性管理

### 7.1 依存関係管理
```json
{
  "scripts": {
    "security-audit": "npm audit --audit-level moderate",
    "security-fix": "npm audit fix",
    "dependency-check": "retire --js --outputformat json"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run security-audit"
    }
  }
}
```

### 7.2 静的コード解析
```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### 7.3 ペネトレーションテスト計画
```typescript
// セキュリティテスト計画
const securityTestPlan = {
  automated: {
    tools: ['OWASP ZAP', 'Nessus', 'Burp Suite'],
    frequency: 'weekly',
    scope: ['authentication', 'authorization', 'input_validation']
  },
  
  manual: {
    frequency: 'monthly',
    scope: [
      'Business logic testing',
      'Session management',
      'Error handling',
      'Information disclosure'
    ]
  },
  
  external: {
    frequency: 'quarterly',
    provider: 'Professional penetration testing service',
    scope: 'Full application assessment'
  }
};
```

## 8. セキュリティ設定

### 8.1 環境変数管理
```typescript
// .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/ccpm"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-refresh-token-secret"
ENCRYPTION_KEY="your-32-byte-encryption-key"
REDIS_URL="redis://localhost:6379"
SMTP_HOST="smtp.example.com"
SMTP_USER="noreply@example.com"
SMTP_PASS="smtp-password"

// 環境変数検証
const validateEnvironment = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  // 秘密鍵の強度チェック
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
};
```

### 8.2 セキュリティヘッダー
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 追加セキュリティヘッダー
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

## 9. コンプライアンス

### 9.1 データ保護規制対応
- **GDPR対応**: EU一般データ保護規則
- **個人情報保護法対応**: 日本の個人情報保護法
- **データポータビリティ**: ユーザーデータのエクスポート機能
- **削除権**: データ削除要求への対応

### 9.2 監査ログ
```typescript
// 監査ログ記録
const auditLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: '/var/log/ccpm/audit.log' })
  ]
});

const logAuditEvent = (event: AuditEvent) => {
  auditLogger.info('Audit Event', {
    user_id: event.userId,
    action: event.action,
    resource: event.resource,
    resource_id: event.resourceId,
    ip_address: event.ipAddress,
    timestamp: new Date().toISOString(),
    details: event.details
  });
};
```

## 10. セキュリティトレーニング

### 10.1 開発者教育
- **セキュアコーディング研修**: OWASP Top 10対策
- **定期的なセキュリティレビュー**: コードレビュー時のセキュリティチェック
- **インシデント対応訓練**: セキュリティインシデント発生時の対応手順

### 10.2 セキュリティ文化の醸成
- **セキュリティ意識向上**: 定期的な啓発活動
- **報告制度**: セキュリティ問題の早期報告奨励
- **継続的改善**: セキュリティ対策の定期的見直し

---

## 更新履歴

| 日付 | 版数 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2025-01-22 | 1.0 | 初版作成 | - |