import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error The validator is a JavaScript module without a declaration file.
import { validateManifest as validateManifestImport } from "./validate-info.mjs";

interface ManifestIssue {
  instancePath: string;
  message?: string;
  keyword: string;
  params?: { additionalProperty?: string; missingProperty?: string };
}

function validateManifest(
  data: unknown,
  schema: object,
): { valid: boolean; errors: ManifestIssue[] } {
  return validateManifestImport(data, schema);
}

const schema = JSON.parse(readFileSync(resolve("info.schema.json"), "utf8")) as object;

function loadJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as Record<string, unknown>;
}

describe("validateManifest", () => {
  it("rejects an extra property", () => {
    const result = validateManifest(loadJson("scripts/fixtures/info/extra-property.json"), schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "additionalProperties")).toBe(true);
  });

  it("rejects a missing author", () => {
    const result = validateManifest(loadJson("scripts/fixtures/info/missing-author.json"), schema);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (error) => error.keyword === "required" && error.params?.missingProperty === "author",
      ),
    ).toBe(true);
  });

  it("rejects {global: dist/global.js} without globalEntry as an additional property", () => {
    const data = loadJson("scripts/fixtures/info/legacy-global.json");
    expect(data.global).toBe("dist/global.js");
    expect(data).not.toHaveProperty("globalEntry");

    const result = validateManifest(data, schema);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (error) =>
          error.keyword === "additionalProperties" && error.params?.additionalProperty === "global",
      ),
    ).toBe(true);
  });

  it("accepts the repo Info.json", () => {
    const result = validateManifest(loadJson("Info.json"), schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts helpPage, subtitleProviders, and localized", () => {
    const result = validateManifest(loadJson("scripts/fixtures/info/optional-fields.json"), schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts a minimal manifest", () => {
    const result = validateManifest(loadJson("scripts/fixtures/info/valid.json"), schema);
    expect(result.valid).toBe(true);
  });
});
