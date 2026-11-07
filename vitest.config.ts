import { defineConfig } from "vitest/config";

// Unit + API test: nhanh, khong can MongoDB
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/integration/**", "node_modules/**"],
  },
});
