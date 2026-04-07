export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'file:./campo.db',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
}