import { RequestHandler } from "express";
import { forbidden, unauthenticated } from "../application/errors";
import { Role } from "../domain/account";

/** Kiem tra role (dat SAU authenticate). Sai role -> 403. */
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.actor) return next(unauthenticated());
    if (!roles.includes(req.actor.role)) return next(forbidden());
    next();
  };
