import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AccountModel } from "../../src/adapters/accountModel";
import { BcryptHasher } from "../../src/adapters/bcryptHasher";
import { JwtTokenService } from "../../src/adapters/jwtTokenService";
import { MongoAccountRepository } from "../../src/adapters/mongoAccountRepository";
import { DuplicateAccountError } from "../../src/application/ports";
import { createApp } from "../../src/app";
import { clearAccounts, connectTestMongo, disconnectTestMongo } from "./mongoTestEnv";

const SECRET = "integration-secret-integration-secret-123";
const hasher = new BcryptHasher(4);
const repo = new MongoAccountRepository();
const tokens = new JwtTokenService(SECRET, "1h");
const app = createApp({ corsOrigins: [], accounts: repo, hasher, tokens, loginRateLimit: false });

const valid = {
  fullName: "Le Minh Nhat",
  email: "nhat@example.com",
  phone: "0912345678",
  password: "123456789ma",
};

beforeAll(connectTestMongo, 120_000); // lan dau co the phai tai mongod
afterEach(clearAccounts);
afterAll(disconnectTestMongo);

describe("Unique index trong MongoDB", () => {
  it("co index unique cho emailNormalized va usernameNormalized (partial)", async () => {
    const indexes = await AccountModel.collection.indexes();

    const email = indexes.find((i) => "emailNormalized" in i.key);
    expect(email?.unique).toBe(true);

    const username = indexes.find((i) => "usernameNormalized" in i.key);
    expect(username?.unique).toBe(true);
    expect(username?.partialFilterExpression).toEqual({ usernameNormalized: { $type: "string" } });
  });

  it("DB tu choi emailNormalized trung (E11000), khong phu thuoc code ung dung", async () => {
    const doc = {
      fullName: "A", email: "a@x.com", emailNormalized: "a@x.com", phone: "0900000000",
      passwordHash: "hash", role: "CUSTOMER", status: "ACTIVE",
    };
    await AccountModel.create(doc);
    await expect(AccountModel.create({ ...doc })).rejects.toMatchObject({ code: 11000 });
  });

  it("nhieu tai khoan KHONG co username van hop le (partial index)", async () => {
    for (const email of ["u1@x.com", "u2@x.com", "u3@x.com"]) {
      const res = await request(app).post("/api/auth/register").send({ ...valid, email });
      expect(res.status).toBe(201);
    }
    expect(await AccountModel.countDocuments()).toBe(3);
  });
});

describe("Repository: anh xa loi trung", () => {
  const base = {
    fullName: "A", phone: "0900000000", passwordHash: "h", role: "CUSTOMER" as const, status: "ACTIVE" as const,
  };

  it("trung email -> DuplicateAccountError('email')", async () => {
    await repo.create({ ...base, email: "a@x.com", emailNormalized: "a@x.com" });
    await expect(repo.create({ ...base, email: "A@x.com", emailNormalized: "a@x.com" })).rejects.toMatchObject({
      field: "email",
    });
  });

  it("trung username -> DuplicateAccountError('username')", async () => {
    await repo.create({ ...base, email: "a@x.com", emailNormalized: "a@x.com", username: "Nhat", usernameNormalized: "nhat" });
    const p = repo.create({ ...base, email: "b@x.com", emailNormalized: "b@x.com", username: "nhat", usernameNormalized: "nhat" });
    await expect(p).rejects.toBeInstanceOf(DuplicateAccountError);
    await expect(p).rejects.toMatchObject({ field: "username" });
  });

  it("findById voi id khong hop le -> null (khong nem loi)", async () => {
    expect(await repo.findById("khong-phai-objectid")).toBeNull();
  });
});

describe("Race condition: nhieu request dang ky dong thoi", () => {
  it("10 request cung email -> dung 1 thanh cong (201), con lai 409, DB chi co 1 ban ghi", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request(app).post("/api/auth/register").send(valid)),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);
    expect(statuses.every((s) => s === 201 || s === 409)).toBe(true); // khong co 500
    expect(await AccountModel.countDocuments({ emailNormalized: "nhat@example.com" })).toBe(1);
  });

  it("cung username, khac email -> dung 1 thanh cong, con lai 409 DUPLICATE_USERNAME", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        request(app).post("/api/auth/register").send({ ...valid, email: `u${i}@example.com`, username: "NhatLe" }),
      ),
    );
    const ok = results.filter((r) => r.status === 201);
    const conflict = results.filter((r) => r.status === 409);
    expect(ok).toHaveLength(1);
    expect(conflict).toHaveLength(7);
    expect(conflict.every((r) => r.body.error.code === "DUPLICATE_USERNAME")).toBe(true);
    expect(await AccountModel.countDocuments({ usernameNormalized: "nhatle" })).toBe(1);
  });

  it("email viet hoa/thuong khac nhau, gui dong thoi -> van chi 1 tai khoan", async () => {
    const variants = ["Nhat@Example.com", "nhat@example.COM", " NHAT@example.com ", "nhat@example.com"];
    const results = await Promise.all(
      variants.map((email) => request(app).post("/api/auth/register").send({ ...valid, email })),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await AccountModel.countDocuments()).toBe(1);
  });
});

describe("Du lieu luu trong DB", () => {
  it("mat khau duoc bam (bcrypt), khong luu mat khau goc", async () => {
    await request(app).post("/api/auth/register").send(valid).expect(201);
    const stored = await AccountModel.findOne({ emailNormalized: "nhat@example.com" })
      .select("+passwordHash")
      .lean();
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.passwordHash).not.toContain(valid.password);
    expect(stored?.emailNormalized).toBe("nhat@example.com");
    expect(stored?.role).toBe("CUSTOMER");
  });

  it("query mac dinh KHONG tra passwordHash (select:false) va toJSON cung khong", async () => {
    await request(app).post("/api/auth/register").send(valid).expect(201);
    const lean = await AccountModel.findOne().lean();
    expect(lean).not.toHaveProperty("passwordHash");

    const withHash = await AccountModel.findOne().select("+passwordHash");
    expect(withHash?.toJSON()).not.toHaveProperty("passwordHash");
  });
});

describe("Dang nhap / phien voi MongoDB that", () => {
  it("dang ky -> dang nhap -> /me tra dung ho so", async () => {
    const reg = await request(app).post("/api/auth/register").send(valid).expect(201);
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "  NHAT@Example.com", password: valid.password })
      .expect(200);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.account.id).toBe(reg.body.account.id);
    expect(JSON.stringify(me.body).toLowerCase()).not.toContain("passwordhash");
  });

  it("token mang dung role cua tai khoan noi bo (STAFF kem managerId)", async () => {
    const manager = await repo.create({
      fullName: "M", email: "m@x.com", emailNormalized: "m@x.com", phone: "0900000002",
      passwordHash: await hasher.hash("Abcd1234"), role: "MANAGER", status: "ACTIVE",
    });
    await AccountModel.create({
      fullName: "S", email: "s@x.com", emailNormalized: "s@x.com", phone: "0900000003",
      passwordHash: await hasher.hash("Abcd1234"), role: "STAFF", status: "ACTIVE", managerId: manager.id,
    });
    const login = await request(app).post("/api/auth/login").send({ email: "s@x.com", password: "Abcd1234" });
    expect(login.status).toBe(200);
    const payload = tokens.verify(login.body.token);
    expect(payload.role).toBe("STAFF");
    expect(payload.managerId).toBe(manager.id);
  });

  it("tai khoan bi khoa: khong dang nhap duoc, token cu cung het hieu luc o /me", async () => {
    await request(app).post("/api/auth/register").send(valid).expect(201);
    const login = await request(app).post("/api/auth/login").send({ email: valid.email, password: valid.password });
    const token = login.body.token as string;

    await AccountModel.updateOne({ emailNormalized: "nhat@example.com" }, { status: "LOCKED" });

    const again = await request(app).post("/api/auth/login").send({ email: valid.email, password: valid.password });
    expect(again.status).toBe(401);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(401);
  });
});
