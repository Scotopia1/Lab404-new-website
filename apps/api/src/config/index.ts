import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Environment
  env: process.env['NODE_ENV'] || 'development',
  isDev: process.env['NODE_ENV'] === 'development',
  isProd: process.env['NODE_ENV'] === 'production',

  // Server
  port: parseInt(process.env['API_PORT'] || '4000', 10),
  apiUrl: process.env['API_URL'] || 'http://localhost:4000',

  // Database
  databaseUrl: process.env['DATABASE_URL'] || '',

  // JWT
  jwtSecret: process.env['JWT_SECRET'] as string,
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',

  // CORS
  corsOrigins: (process.env['CORS_ORIGINS'] || 'http://localhost:3000,http://localhost:3001').split(','),

  // ImageKit
  imagekit: {
    publicKey: process.env['IMAGEKIT_PUBLIC_KEY'] || '',
    privateKey: process.env['IMAGEKIT_PRIVATE_KEY'] || '',
    urlEndpoint: process.env['IMAGEKIT_URL_ENDPOINT'] || '',
  },

  // SMTP
  smtp: {
    host: process.env['SMTP_HOST'] || '',
    port: parseInt(process.env['SMTP_PORT'] || '587', 10),
    secure: process.env['SMTP_SECURE'] === 'true',
    user: process.env['SMTP_USER'] || '',
    pass: process.env['SMTP_PASS'] || '',
    from: process.env['EMAIL_FROM'] || 'noreply@lab404electronics.com',
  },

  // Stripe (Future)
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] || '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] || '',
  },

  // Google APIs
  google: {
    apiKey: process.env['GOOGLE_API_KEY'] || '',
    searchEngineId: process.env['GOOGLE_SEARCH_ENGINE_ID'] || '',
  },

  // Store defaults
  store: {
    name: process.env['STORE_NAME'] || 'Lab404Electronics',
    currency: process.env['STORE_CURRENCY'] || 'USD',
    defaultTaxRate: parseFloat(process.env['DEFAULT_TAX_RATE'] || '0.11'),
  },

  // URLs
  urls: {
    admin: process.env['ADMIN_URL'] || 'http://localhost:3001',
    web: process.env['WEB_URL'] || 'http://localhost:3000',
  },
} as const;

// Validate required config
export function validateConfig(): void {
  const required = [
    ['DATABASE_URL', config.databaseUrl],
    ['JWT_SECRET', config.jwtSecret],
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT_SECRET length (minimum 32 characters for security)
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long. Generate a secure secret with: openssl rand -base64 32');
  }
}
