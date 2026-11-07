import { ErrorRequestHandler, RequestHandler } from "express";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { AppError } from "../application/errors";

export { AppError };

/** Route khong ton tai -> 404 dang JSON */
export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Khong tim thay ${req.method} ${req.path}` },
  });
};

/** Xu ly loi tap trung. KHONG tra stack trace cho client. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Validate that bai (zod) -> 400 kem loi theo tung field
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Du lieu khong hop le",
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  // JSON body sai cu phap / qua lon (express.json)
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "BAD_JSON", message: "JSON khong hop le" } });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Du lieu qua lon" } });
  }

  // Loi khong du doan: log o server kem ma tra cuu, client chi nhan thong bao chung
  const correlationId = randomUUID();
  console.error(`[${correlationId}]`, err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Loi he thong", correlationId },
  });
};
