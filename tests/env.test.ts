import { describe, expect, it } from "vitest";
import { loadAuthEnv, loadEnv } from "../src/config/env";

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe("loadEnv", () => {
  it("doc PORT, MONGODB_URI, CORS_ORIGIN (nhieu origin)", () => {
    const e = loadEnv(
      env({ PORT: "5000", MONGODB_URI: "mongodb://localhost:27017/x", CORS_ORIGIN: "http://a.com, http://b.com" }),
    );
    expect(e.port).toBe(5000);
    expect(e.corsOrigins).toEqual(["http://a.com", "http://b.com"]);
  });

  it("thieu MONGODB_URI -> bao loi", () => {
    expect(() => loadEnv(env({ PORT: "4000" }))).toThrow(/MONGODB_URI/);
  });

  it("PORT khong hop le -> bao loi", () => {
    expect(() => loadEnv(env({ PORT: "abc", MONGODB_URI: "mongodb://x" }))).toThrow(/PORT/);
  });

  it("khong yeu cau JWT_SECRET (de db:check chay voi .env co ban)", () => {
    expect(() => loadEnv(env({ MONGODB_URI: "mongodb://x" }))).not.toThrow();
  });
});

describe("loadAuthEnv", () => {
  it("thieu hoac ngan JWT_SECRET -> bao loi", () => {
    expect(() => loadAuthEnv(env({}))).toThrow(/JWT_SECRET/);
    expect(() => loadAuthEnv(env({ JWT_SECRET: "ngan" }))).toThrow(/JWT_SECRET/);
  });

  it("gia tri mac dinh hop le", () => {
    const a = loadAuthEnv(env({ JWT_SECRET: "x".repeat(32) }));
    expect(a.jwtExpiresIn).toBe("8h");
    expect(a.bcryptCost).toBe(10);
  });
});
