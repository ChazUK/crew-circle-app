/**
 * Shared module registry for convex-test.
 * Must live at the convex/ root so glob keys match Convex's function path convention.
 * e.g. "./users/mutations.ts" → "users/mutations"
 */
export const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
