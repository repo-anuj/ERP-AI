/**
 * Environment validation utility for production deployment
 * This ensures all required environment variables are set correctly
 */

interface EnvironmentConfig {
  DATABASE_URL: string;
  JWT_SECRET_KEY: string;
  NODE_ENV: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the current environment configuration
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredVars: (keyof EnvironmentConfig)[] = [
    'DATABASE_URL',
    'JWT_SECRET_KEY',
    'NODE_ENV'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // Specific validations
    switch (varName) {
      case 'DATABASE_URL':
        if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
          errors.push('DATABASE_URL must be a valid MongoDB connection string');
        }
        break;

      case 'JWT_SECRET_KEY':
        if (value === 'your-secret-key-here-development-only' || value.length < 32) {
          if (process.env.NODE_ENV === 'production') {
            errors.push('JWT_SECRET_KEY must be a secure secret key in production (minimum 32 characters)');
          } else {
            warnings.push('JWT_SECRET_KEY should be changed from default value');
          }
        }
        break;

      case 'NODE_ENV':
        if (!['development', 'production', 'test'].includes(value)) {
          warnings.push('NODE_ENV should be one of: development, production, test');
        }
        break;
    }
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // Check for development-only values
    if (process.env.DATABASE_URL?.includes('localhost')) {
      warnings.push('Using localhost database URL in production environment');
    }

    // Check for secure configurations
    if (!process.env.DATABASE_URL?.includes('ssl=true') && 
        process.env.DATABASE_URL?.startsWith('mongodb+srv://')) {
      warnings.push('Consider enabling SSL for production database connections');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Logs environment validation results
 */
export function logEnvironmentValidation(): boolean {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.isValid) {
    console.log('✅ Environment validation passed');
  }

  return result.isValid;
}

/**
 * Gets the current environment configuration (safe for logging)
 */
export function getEnvironmentInfo() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 
      'Not set',
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? 
      `Set (${process.env.JWT_SECRET_KEY.length} characters)` : 
      'Not set',
    VERCEL: process.env.VERCEL ? 'Yes' : 'No',
    RENDER: process.env.RENDER ? 'Yes' : 'No',
  };
}
