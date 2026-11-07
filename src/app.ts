import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AccountRepository, PasswordHasher, TokenService } from "./application/ports";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { createApiRouter } from "./routes/api";
import { createHealthRouter } from "./routes/health";

export interface AppOptions {
  corsOrigins: string[];
  accounts: AccountRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  /** Tra ve trang thai ket noi DB (inject de test khong can Mongo) */
  getDbStatus?: () => string;
  /** Tat gioi han so lan dang nhap khi test */
  loginRateLimit?: boolean;
}

export function createApp(options: AppOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // dang sau Nginx/gateway
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigins.length ? options.corsOrigins : false }));
  app.use(express.json({ limit: "1mb" }));

  const loginLimiter =
    options.loginRateLimit === false
      ? undefined
      : rateLimit({
          windowMs: 15 * 60 * 1000,
          limit: 20,
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: { code: "TOO_MANY_REQUESTS", message: "Thu lai sau it phut" } },
        });

  app.use("/health", createHealthRouter(options.getDbStatus ?? (() => "unknown")));
  app.use(
    "/api",
    createApiRouter({
      accounts: options.accounts,
      hasher: options.hasher,
      tokens: options.tokens,
      loginLimiter,
    }),
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
