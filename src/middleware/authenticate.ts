import { RequestHandler } from "express";
import { TokenService } from "../application/ports";
import { unauthenticated } from "../application/errors";
import { Actor } from "../domain/policy";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor?: Actor;
    }
  }
}

/** Xac thuc JWT (FR-AUTH-05). Thieu/sai/het han -> 401, khong tiet lo chi tiet token. */
export const createAuthenticate =
  (tokens: TokenService): RequestHandler =>
  (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return next(unauthenticated());
    try {
      const p = tokens.verify(header.slice(7));
      req.actor = { id: p.sub, role: p.role, managerId: p.managerId };
      next();
    } catch {
      next(unauthenticated());
    }
  };
