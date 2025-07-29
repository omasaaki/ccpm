import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';

export class EmailService {
  private static transporter: Transporter;

  // Initialize email transporter
  private static getTransporter(): Transporter {
    if (!this.transporter) {
      if (config.nodeEnv === 'test') {
        // Use ethereal email for testing
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass',
          },
        });
      } else {
        // Use configured SMTP settings
        this.transporter = nodemailer.createTransport({
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure,
          auth: {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass,
          },
        });
      }
    }
    return this.transporter;
  }

  // Send email verification
  static async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${config.app.url}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'CCPMへようこそ - メールアドレスの確認',
      html: `
        <h2>こんにちは</h2>
        <p>CCPMへのご登録ありがとうございます。</p>
        <p>以下のリンクをクリックして、メールアドレスを確認してください：</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">メールアドレスを確認</a>
        <p>または、以下のURLをブラウザにコピー＆ペーストしてください：</p>
        <p>${verificationUrl}</p>
        <p>このリンクは24時間有効です。</p>
        <p>このメールに心当たりがない場合は、無視してください。</p>
        <hr>
        <p>CCPM Team</p>
      `,
      text: `
        こんにちは

        CCPMへのご登録ありがとうございます。

        以下のリンクをクリックして、メールアドレスを確認してください：
        ${verificationUrl}

        このリンクは24時間有効です。

        このメールに心当たりがない場合は、無視してください。

        CCPM Team
      `,
    };

    if (config.nodeEnv === 'development') {
      console.log('Email verification URL:', verificationUrl);
    }

    try {
      await this.getTransporter().sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email verification:', error);
      throw new Error('メール送信に失敗しました');
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.app.url}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'CCPM - パスワードリセット',
      html: `
        <h2>こんにちは</h2>
        <p>パスワードリセットのリクエストを受け付けました。</p>
        <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">パスワードをリセット</a>
        <p>または、以下のURLをブラウザにコピー＆ペーストしてください：</p>
        <p>${resetUrl}</p>
        <p>このリンクは1時間有効です。</p>
        <p>パスワードリセットをリクエストしていない場合は、このメールを無視してください。</p>
        <hr>
        <p>CCPM Team</p>
      `,
      text: `
        こんにちは

        パスワードリセットのリクエストを受け付けました。

        以下のリンクをクリックして、新しいパスワードを設定してください：
        ${resetUrl}

        このリンクは1時間有効です。

        パスワードリセットをリクエストしていない場合は、このメールを無視してください。

        CCPM Team
      `,
    };

    if (config.nodeEnv === 'development') {
      console.log('Password reset URL:', resetUrl);
    }

    try {
      await this.getTransporter().sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('メール送信に失敗しました');
    }
  }

  // Send account locked notification
  static async sendAccountLockNotification(email: string): Promise<void> {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'CCPM - アカウントロックの通知',
      html: `
        <h2>こんにちは</h2>
        <p>複数回のログイン試行に失敗したため、セキュリティ上の理由からアカウントが一時的にロックされました。</p>
        <p>15分後に再度ログインをお試しください。</p>
        <p>このアクティビティに心当たりがない場合は、パスワードをリセットすることをお勧めします。</p>
        <hr>
        <p>CCPM Team</p>
      `,
      text: `
        こんにちは

        複数回のログイン試行に失敗したため、セキュリティ上の理由からアカウントが一時的にロックされました。

        15分後に再度ログインをお試しください。

        このアクティビティに心当たりがない場合は、パスワードをリセットすることをお勧めします。

        CCPM Team
      `,
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send account locked notification:', error);
      // Don't throw error for notification emails
    }
  }

  // Send password reset confirmation
  static async sendPasswordResetConfirmation(email: string): Promise<void> {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'CCPM - パスワードリセット完了',
      html: `
        <h2>パスワードが正常にリセットされました</h2>
        <p>パスワードが正常に変更されました。</p>
        <p>この変更に心当たりがない場合は、すぐにお問い合わせください。</p>
        <hr>
        <p>CCPM Team</p>
      `,
      text: `
        パスワードが正常にリセットされました

        パスワードが正常に変更されました。

        この変更に心当たりがない場合は、すぐにお問い合わせください。

        CCPM Team
      `,
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset confirmation:', error);
      // Don't throw error for notification emails
    }
  }

  // Send welcome email
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'CCPMへようこそ',
      html: `
        <h2>ようこそ、${name}さん！</h2>
        <p>メールアドレスが確認されました。</p>
        <p>CCPMを使ってプロジェクト管理を始めましょう！</p>
        <p><a href="${config.app.url}/login" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">ログイン</a></p>
        <hr>
        <p>CCPM Team</p>
      `,
      text: `
        ようこそ、${name}さん！

        メールアドレスが確認されました。

        CCPMを使ってプロジェクト管理を始めましょう！

        ログイン: ${config.app.url}/login

        CCPM Team
      `,
    };

    try {
      await this.getTransporter().sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw error for notification emails
    }
  }
}