import { defineConfig } from "vitest/config";

// Integration test: dung MongoDB that (in-memory hoac MONGODB_URI_TEST)
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
