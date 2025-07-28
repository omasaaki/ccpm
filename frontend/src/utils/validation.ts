// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<string, ValidationRule>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const rule = rules[field];

    if (!rule) return;

    // Required validation
    if (rule.required && (!value || value === '')) {
      errors[field] = 'このフィールドは必須です';
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      return;
    }

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = '有効なメールアドレスを入力してください';
        return;
      }
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.minLength}文字以上で入力してください`;
      return;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.maxLength}文字以下で入力してください`;
      return;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = '形式が正しくありません';
      return;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};

export class ValidationUtils {
  // Email validation
  static validateEmail(email: string): string | null {
    if (!email) return 'メールアドレスは必須です';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '有効なメールアドレスを入力してください';
    }
    
    return null;
  }

  // Password validation
  static validatePassword(password: string): string | null {
    if (!password) return 'パスワードは必須です';
    if (password.length < 6) return 'パスワードは6文字以上で入力してください';
    return null;
  }

  // Password confirmation validation
  static validatePasswordConfirmation(password: string, confirmation: string): string | null {
    if (!confirmation) return 'パスワード確認は必須です';
    if (password !== confirmation) return 'パスワードが一致しません';
    return null;
  }

  // Username validation
  static validateUsername(username: string): string | null {
    if (!username) return 'ユーザー名は必須です';
    if (username.length < 3) return 'ユーザー名は3文字以上で入力してください';
    if (username.length > 30) return 'ユーザー名は30文字以下で入力してください';
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return 'ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます';
    }
    
    return null;
  }

  // Project name validation
  static validateProjectName(name: string): string | null {
    if (!name) return 'プロジェクト名は必須です';
    if (name.length > 200) return 'プロジェクト名は200文字以下で入力してください';
    return null;
  }

  // Task title validation
  static validateTaskTitle(title: string): string | null {
    if (!title) return 'タスクタイトルは必須です';
    if (title.length > 200) return 'タスクタイトルは200文字以下で入力してください';
    return null;
  }

  // Date validation
  static validateDateRange(startDate?: string, endDate?: string): string | null {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return '終了日は開始日より後の日付を設定してください';
    }
    
    return null;
  }

  // Generic field validation
  static validateField(value: any, rules: ValidationRule): string | null {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'この項目は必須です';
    }

    // Skip other validations if value is empty and not required
    if (!value) return null;

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return `${rules.minLength}文字以上で入力してください`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${rules.maxLength}文字以下で入力してください`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return '正しい形式で入力してください';
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }

  // Validate form object
  static validateForm(formData: Record<string, any>, rules: Record<string, ValidationRule>): ValidationErrors {
    const errors: ValidationErrors = {};

    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      if (!rule) return;
      const error = this.validateField(formData[field], rule);
      if (error) {
        errors[field] = error;
      }
    });

    return errors;
  }
}