import { BcryptHasher } from "../../src/adapters/bcryptHasher";
import { JwtTokenService } from "../../src/adapters/jwtTokenService";
import { createApp } from "../../src/app";
import { InMemoryAccountRepository } from "./inMemoryAccountRepository";

export const TEST_SECRET = "test-secret-test-secret-test-secret-123";

export function buildTestApp(corsOrigins: string[] = ["http://localhost:5173"]) {
  const accounts = new InMemoryAccountRepository();
  const hasher = new BcryptHasher(4); // cost thap cho test nhanh
  const tokens = new JwtTokenService(TEST_SECRET, "1h");
  const app = createApp({
    corsOrigins,
    accounts,
    hasher,
    tokens,
    getDbStatus: () => "connected",
    loginRateLimit: false,
  });
  return { app, accounts, tokens };
}
