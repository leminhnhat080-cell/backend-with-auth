import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "./helpers/buildApp";

const { app } = buildTestApp();

describe("GET /health", () => {
  it("tra 200 va thong tin trang thai", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("GET /api", () => {
  it("tra 200 va ten API", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("HSU Shoe Shop API");
  });
});

describe("Endpoint khong ton tai", () => {
  it("GET duong dan la -> 404 dang JSON", async () => {
    const res = await request(app).get("/khong-ton-tai");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST vao route khong ton tai -> 404", async () => {
    const res = await request(app).post("/api/xyz").send({ a: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("Xu ly loi co ban", () => {
  it("JSON sai cu phap -> 400 BAD_JSON, khong lo stack", async () => {
    const res = await request(app)
      .post("/api")
      .set("Content-Type", "application/json")
      .send('{"abc":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_JSON");
    expect(JSON.stringify(res.body)).not.toContain("at ");
  });
});

describe("CORS", () => {
  it("cho phep origin trong CORS_ORIGIN", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("khong cap header cho origin la", async () => {
    const res = await request(app).get("/health").set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
