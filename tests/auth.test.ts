import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { BcryptHasher } from "../src/adapters/bcryptHasher";
import { JwtTokenService } from "../src/adapters/jwtTokenService";
import { createApp } from "../src/app";
import { canManageStaff, canViewAccount, canViewOrder } from "../src/domain/policy";
import { createAuthenticate } from "../src/middleware/authenticate";
import { authorize } from "../src/middleware/authorize";
import { errorHandler } from "../src/middleware/errorHandler";
import { InMemoryAccountRepository } from "./helpers/inMemoryAccountRepository";

const SECRET = "test-secret-test-secret-test-secret-123";
const valid = {
  fullName: "Le Minh Nhat",
  email: "nhat@example.com",
  phone: "0912345678",
  password: "123456789ma",
};

function build() {
  const repo = new InMemoryAccountRepository();
  const hasher = new BcryptHasher(4); // cost thap cho test nhanh
  const tokens = new JwtTokenService(SECRET, "1h");
  const app = createApp({ accounts: repo, hasher, tokens, corsOrigins: [], loginRateLimit: false });
  return { app, repo, tokens };
}

describe("AC1 - Dang ky hop le tao CUSTOMER", () => {
  it("tao CUSTOMER va bo qua role gui len", async () => {
    const { app } = build();
    const res = await request(app).post("/api/auth/register").send({ ...valid, role: "ADMIN" });
    expect(res.status).toBe(201);
    expect(res.body.account.role).toBe("CUSTOMER");
  });
  it("username la tuy chon (chuoi rong coi nhu khong co)", async () => {
    const { app } = build();
    const res = await request(app).post("/api/auth/register").send({ ...valid, username: "" });
    expect(res.status).toBe(201);
  });
  it("du lieu sai tra 400 co field loi", async () => {
    const { app } = build();
    const res = await request(app).post("/api/auth/register").send({ ...valid, email: "abc", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.email).toBeDefined();
    expect(res.body.error.details.password).toBeDefined();
  });
});

describe("AC2 - Tu choi email/username trung sau chuan hoa", () => {
  it("email trung khac hoa/thuong va khoang trang", async () => {
    const { app } = build();
    await request(app).post("/api/auth/register").send(valid).expect(201);
    const res = await request(app).post("/api/auth/register").send({ ...valid, email: "  NHAT@Example.COM " });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_EMAIL");
  });
  it("username trung sau chuan hoa", async () => {
    const { app } = build();
    await request(app).post("/api/auth/register").send({ ...valid, username: "NhatLe" }).expect(201);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...valid, email: "other@example.com", username: "nhatle" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_USERNAME");
  });
});

describe("AC3 - Dang nhap sai tra loi phu hop", () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(async () => {
    ctx = build();
    await request(ctx.app).post("/api/auth/register").send(valid).expect(201);
  });

  it("dang nhap dung tra token", async () => {
    const res = await request(ctx.app).post("/api/auth/login").send({ email: "NHAT@example.com", password: valid.password });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });
  it("sai mat khau / sai email / tai khoan khoa -> cung 1 thong bao 401", async () => {
    ctx.repo.items.push({ ...ctx.repo.items[0], id: "locked", emailNormalized: "locked@example.com", status: "LOCKED" });
    const wrongPw = await request(ctx.app).post("/api/auth/login").send({ email: valid.email, password: "Sai12345" });
    const noUser = await request(ctx.app).post("/api/auth/login").send({ email: "none@example.com", password: valid.password });
    const locked = await request(ctx.app).post("/api/auth/login").send({ email: "locked@example.com", password: valid.password });
    for (const r of [wrongPw, noUser, locked]) expect(r.status).toBe(401);
    expect(wrongPw.body.error.message).toBe(noUser.body.error.message);
    expect(wrongPw.body.error.message).toBe(locked.body.error.message);
  });
});

describe("AC4 - Khong JWT / sai role khong vao duoc API noi bo", () => {
  const { tokens } = build();
  const internal = express();
  internal.get("/internal/products", createAuthenticate(tokens), authorize("MANAGER", "ADMIN"), (_q, r) => {
    r.json({ ok: true });
  });
  internal.use(errorHandler);

  it("khong token -> 401", async () => {
    expect((await request(internal).get("/internal/products")).status).toBe(401);
  });
  it("token rac / het han -> 401", async () => {
    const bad = await request(internal).get("/internal/products").set("Authorization", "Bearer abc.def.ghi");
    expect(bad.status).toBe(401);
    const expired = new JwtTokenService(SECRET, "-10s").sign({ sub: "x", role: "ADMIN" });
    const res = await request(internal).get("/internal/products").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
  it("sai role (CUSTOMER, STAFF) -> 403", async () => {
    for (const role of ["CUSTOMER", "STAFF"] as const) {
      const t = tokens.sign({ sub: "u1", role });
      const res = await request(internal).get("/internal/products").set("Authorization", `Bearer ${t}`);
      expect(res.status).toBe(403);
    }
  });
  it("dung role -> 200", async () => {
    const t = tokens.sign({ sub: "m1", role: "MANAGER" });
    const res = await request(internal).get("/internal/products").set("Authorization", `Bearer ${t}`);
    expect(res.status).toBe(200);
  });
});

describe("AC5 - Khong doc du lieu ngoai pham vi", () => {
  it("canViewAccount: chinh chu hoac Admin", () => {
    expect(canViewAccount({ id: "a", role: "CUSTOMER" }, "a")).toBe(true);
    expect(canViewAccount({ id: "a", role: "CUSTOMER" }, "b")).toBe(false);
    expect(canViewAccount({ id: "x", role: "ADMIN" }, "b")).toBe(true);
  });
  it("canViewOrder theo role (BR-20)", () => {
    const order = { orderStatus: "CONFIRMED", accountId: "c1", assignedStaffId: "s1", handledByManagerId: "m1", assignedStaffManagerId: "m1" };
    expect(canViewOrder({ id: "c1", role: "CUSTOMER" }, order)).toBe(true);
    expect(canViewOrder({ id: "c2", role: "CUSTOMER" }, order)).toBe(false);
    expect(canViewOrder({ id: "s1", role: "STAFF" }, order)).toBe(true);
    expect(canViewOrder({ id: "s2", role: "STAFF" }, order)).toBe(false);
    expect(canViewOrder({ id: "m1", role: "MANAGER" }, order)).toBe(true);
    expect(canViewOrder({ id: "m2", role: "MANAGER" }, order)).toBe(false); // Manager B khong thay don da xac nhan cua Manager A
    expect(canViewOrder({ id: "m2", role: "MANAGER" }, { ...order, orderStatus: "PENDING" })).toBe(true);
    expect(canViewOrder({ id: "ad", role: "ADMIN" }, order)).toBe(true);
  });
  it("canManageStaff: Manager chi quan ly Staff cua minh", () => {
    expect(canManageStaff({ id: "m1", role: "MANAGER" }, { managerId: "m1" })).toBe(true);
    expect(canManageStaff({ id: "m2", role: "MANAGER" }, { managerId: "m1" })).toBe(false);
  });
  it("GET /me chi tra ho so cua chinh minh", async () => {
    const { app } = build();
    const reg = await request(app).post("/api/auth/register").send(valid);
    const login = await request(app).post("/api/auth/login").send({ email: valid.email, password: valid.password });
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.account.id).toBe(reg.body.account.id);
  });
});

describe("AC6 - API khong tra mat khau / passwordHash", () => {
  it("register, login, me deu khong chua password/passwordHash", async () => {
    const { app } = build();
    const reg = await request(app).post("/api/auth/register").send(valid);
    const login = await request(app).post("/api/auth/login").send({ email: valid.email, password: valid.password });
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    for (const r of [reg, login, me]) {
      const body = JSON.stringify(r.body).toLowerCase();
      expect(body).not.toContain("passwordhash");
      expect(body).not.toContain(valid.password.toLowerCase());
    }
  });
});
