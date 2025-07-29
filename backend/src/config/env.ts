import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-for-development',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000'],
  },
  api: {
    version: 'v1',
    prefix: '/api/v1',
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@ccpm.com',
  },
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  auth: {
    lockoutThreshold: parseInt(process.env.AUTH_LOCKOUT_THRESHOLD || '5'),
    lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION || '900000'), // 15 minutes in ms
    passwordResetExpiration: parseInt(process.env.PASSWORD_RESET_EXPIRATION || '3600000'), // 1 hour in ms
    emailVerificationExpiration: parseInt(process.env.EMAIL_VERIFICATION_EXPIRATION || '86400000'), // 24 hours in ms
  },
} as const;

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}