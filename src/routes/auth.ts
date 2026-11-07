import { RequestHandler, Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthController } from "../controllers/authController";

export function createAuthRouter(
  c: AuthController,
  authenticate: RequestHandler,
  loginLimiter?: RequestHandler,
): Router {
  const r = Router();
  r.post("/register", asyncHandler(c.register));
  r.post("/login", ...(loginLimiter ? [loginLimiter] : []), asyncHandler(c.signIn));
  r.post("/logout", authenticate, asyncHandler(c.logout));
  r.get("/me", authenticate, asyncHandler(c.me));
  return r;
}
