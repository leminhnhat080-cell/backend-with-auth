import "dotenv/config";

export interface Env {
  port: number;
  mongoUri: string;
  corsOrigins: string[];
}

/**
 * Doc va kiem tra bien moi truong. Goi trong server.ts / scripts (khong goi luc import
 * de test khong can file .env).
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const port = Number(source.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT khong hop le: "${source.PORT}"`);
  }

  const mongoUri = source.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error("Thieu MONGODB_URI. Hay tao file .env tu .env.example");
  }

  const corsOrigins = (source.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { port, mongoUri, corsOrigins };
}

export interface AuthEnv {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptCost: number;
}

/** Bien moi truong rieng cho xac thuc (P01). Chi server can, db:check khong can. */
export function loadAuthEnv(source: NodeJS.ProcessEnv = process.env): AuthEnv {
  const jwtSecret = source.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("Thieu JWT_SECRET hoac qua ngan (can >= 32 ky tu). Them vao .env");
  }
  const bcryptCost = Number(source.BCRYPT_COST ?? 10);
  if (!Number.isInteger(bcryptCost) || bcryptCost < 4 || bcryptCost > 15) {
    throw new Error(`BCRYPT_COST khong hop le: "${source.BCRYPT_COST}"`);
  }
  return { jwtSecret, jwtExpiresIn: source.JWT_EXPIRES_IN ?? "8h", bcryptCost };
}
