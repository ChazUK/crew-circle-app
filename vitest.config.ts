import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "convex",
          include: ["convex/**/*.test.ts"],
          environment: "edge-runtime",
        },
      },
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "json-summary", "html"],
      include: ["convex/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "convex/auth.config.ts",
        "convex/schema.ts",
        "convex/users/schema.ts",
        "convex/http.ts",
        "convex/webhooks/**",
        "convex/**/mutations.ts",
        "convex/**/webhooks.ts",
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
