import { z } from "zod";
import { normalizePhone } from "../domain/normalize";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

// Luu y: zod mac dinh BO QUA field la -> "role" gui len bi loai, khong bao gio duoc dung (BR-02)
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Ho ten toi thieu 2 ky tu").max(100),
  email: z.string().trim().email("Email khong hop le").max(254),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => /^0\d{9}$/.test(p), "So dien thoai khong hop le"),
  password: z
    .string()
    .min(8, "Mat khau toi thieu 8 ky tu")
    .max(72, "Mat khau toi da 72 ky tu") // gioi han cua bcrypt
    .regex(/[A-Za-z]/, "Mat khau can co chu cai")
    .regex(/\d/, "Mat khau can co chu so"),
  username: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9._-]+$/, "Username chi gom chu, so, . _ -")
      .optional(),
  ),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});
