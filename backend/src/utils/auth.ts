import bcrypt from 'bcrypt';
const jwt = require('jsonwebtoken');
import { config } from '../config/env';
import { JwtPayload } from '../types/auth';

export class AuthUtils {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcrypt.saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate access token
  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as object, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }

  // Generate refresh token
  static generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as object, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  }

  // Generate both tokens
  static generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}