import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "json-summary", "html"],
      include: ["convex/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "convex/_helpers/**",
        "convex/auth.config.ts",
        "convex/schema.ts",
        "convex/_testModules.ts",
        "**/*.d.ts",
        "**/*.test.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
