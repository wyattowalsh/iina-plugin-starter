#!/usr/bin/env node
/* global console, process */
/**
 * Validate an IINA Info.json manifest against info.schema.json.
 *
 * Usage: node scripts/validate-info.mjs [path/to/Info.json]
 */
import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

/**
 * @typedef {object} ManifestIssue
 * @property {string} instancePath
 * @property {string} [message]
 * @property {string} keyword
 * @property {Record<string, unknown>} [params]
 */

/**
 * @param {unknown} data
 * @param {object} schema
 * @returns {{ valid: boolean, errors: ManifestIssue[] }}
 */
export function validateManifest(data, schema) {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data) === true;
  return { valid, errors: validate.errors ?? [] };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function main() {
  const manifestPath = process.argv[2] ?? "./Info.json";
  const schemaPath = resolve(dirname(fileURLToPath(import.meta.url)), "../info.schema.json");

  let data;
  let schema;
  try {
    data = readJson(manifestPath);
    schema = readJson(schemaPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }

  let result;
  try {
    result = validateManifest(data, schema);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }

  if (result.valid) {
    const name =
      data && typeof data === "object" && "name" in data && typeof data.name === "string"
        ? data.name
        : resolve(manifestPath);
    console.log(`${name} valid`);
    process.exit(0);
  }

  for (const error of result.errors) {
    console.error(`${error.instancePath}: ${error.message}`);
  }
  process.exit(1);
}

if (isDirectRun()) {
  main();
}
