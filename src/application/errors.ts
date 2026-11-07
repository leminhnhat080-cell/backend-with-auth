export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const unauthenticated = () => new AppError(401, "UNAUTHENTICATED", "Chua dang nhap hoac phien khong hop le");
export const forbidden = () => new AppError(403, "FORBIDDEN", "Khong co quyen truy cap");
export const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "Email hoac mat khau khong dung");
export const duplicate = (field: "email" | "username") =>
  new AppError(
    409,
    "DUPLICATE_" + field.toUpperCase(),
    field === "email" ? "Email da duoc su dung" : "Username da duoc su dung",
  );
