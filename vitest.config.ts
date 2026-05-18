import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: true,
    setupFiles: ["tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    coverage: {
      reporter: ["text", "html"]
    }
  }
});
