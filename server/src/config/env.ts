import dotenv from 'dotenv';
import path from 'path';

// Load root .env first (when running from repo root), then server/.env so server overrides
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, '..', '.env') });
dotenv.config({ path: path.join(cwd, '.env') });
dotenv.config(); // cwd as fallback

export const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/inventory',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
};
