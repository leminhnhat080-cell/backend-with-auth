import { Router } from "express";

export function createHealthRouter(getDbStatus: () => string): Router {
  const router = Router();

  // Liveness: process con song. Luon 200; trang thai DB hien trong body.
  router.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "hsu-shoe-shop-api",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      db: getDbStatus(),
    });
  });

  return router;
}
