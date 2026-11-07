import { RequestHandler, Router } from "express";
import { GetMe } from "../application/getMe";
import { Login } from "../application/login";
import { AccountRepository, PasswordHasher, TokenService } from "../application/ports";
import { RegisterCustomer } from "../application/registerCustomer";
import { AuthController } from "../controllers/authController";
import { createAuthenticate } from "../middleware/authenticate";
import { createAuthRouter } from "./auth";

export interface ApiDeps {
  accounts: AccountRepository;
  hasher: PasswordHasher;
  tokens: TokenService;
  loginLimiter?: RequestHandler;
}

export function createApiRouter(deps: ApiDeps): Router {
  const router = Router();

  // Thong tin chung ve API (de FE/nhom kiem tra nhanh)
  router.get("/", (_req, res) => {
    res.json({
      name: "HSU Shoe Shop API",
      version: process.env.npm_package_version ?? "1.0.0",
      endpoints: [
        "GET /health",
        "GET /api",
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/logout",
        "GET /api/auth/me",
      ],
    });
  });

  // P01 - Tai khoan & Phan quyen
  const authController = new AuthController(
    new RegisterCustomer(deps.accounts, deps.hasher),
    new Login(deps.accounts, deps.hasher, deps.tokens),
    new GetMe(deps.accounts),
  );
  router.use("/auth", createAuthRouter(authController, createAuthenticate(deps.tokens), deps.loginLimiter));

  // Cac module tiep theo (P02..P07) mount tai day.

  return router;
}
