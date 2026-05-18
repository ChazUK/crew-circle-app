import { describe, expect, test } from "vitest";

import { validateImdbId } from "./validateImdbId";

describe("validateImdbId", () => {
  test("extracts id from full IMDB URL", () => {
    expect(validateImdbId("https://www.imdb.com/name/nm0000123/")).toBe("nm0000123");
  });

  test("extracts bare id", () => {
    expect(validateImdbId("nm0000123")).toBe("nm0000123");
  });

  test("extracts id from URL without trailing slash", () => {
    expect(validateImdbId("https://www.imdb.com/name/nm0000123")).toBe("nm0000123");
  });

  test("returns null for garbage input", () => {
    expect(validateImdbId("not-an-imdb-id")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(validateImdbId("")).toBeNull();
  });

  test("extracts id from URL with extra path segments", () => {
    expect(validateImdbId("https://www.imdb.com/name/nm1234567/bio")).toBe("nm1234567");
  });
});
