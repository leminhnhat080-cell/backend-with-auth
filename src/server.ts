import mongoose from "mongoose";
import { AccountModel } from "./adapters/accountModel";
import { BcryptHasher } from "./adapters/bcryptHasher";
import { JwtTokenService } from "./adapters/jwtTokenService";
import { MongoAccountRepository } from "./adapters/mongoAccountRepository";
import { createApp } from "./app";
import { loadAuthEnv, loadEnv } from "./config/env";

const DB_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

async function main() {
  const env = loadEnv();
  const auth = loadAuthEnv();

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected (db: ${mongoose.connection.name})`);

  // Dam bao unique index (emailNormalized, usernameNormalized) ton tai
  await AccountModel.syncIndexes();

  const app = createApp({
    corsOrigins: env.corsOrigins,
    accounts: new MongoAccountRepository(),
    hasher: new BcryptHasher(auth.bcryptCost),
    tokens: new JwtTokenService(auth.jwtSecret, auth.jwtExpiresIn),
    getDbStatus: () => DB_STATES[mongoose.connection.readyState] ?? "unknown",
  });

  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  // Tat server gon gang khi Ctrl+C / Docker stop
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Khoi dong that bai:", err instanceof Error ? err.message : err);
  process.exit(1);
});
