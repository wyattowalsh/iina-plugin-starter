#!/usr/bin/env node
/* global console, process */
/**
 * Make Parcel's webview HTML loadable from IINA's file-backed WKWebView.
 * Keep the classic nomodule bundle, drop the module twin, and point src at
 * the file that actually exists, including a shared bundle in a sibling folder.
 */
import { existsSync, readdirSync, promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function rewriteWebviewHtml(html, resolveUrl = toRelativeUrl) {
  const withoutModules = html.replace(
    /<script\b[^>]*\btype\s*=\s*(?:"module"|'module'|module)\b[^>]*>\s*<\/script>/gi,
    "",
  );
  const classic = withoutModules.replace(
    /\s(?:nomodule|defer)(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?/gi,
    "",
  );
  return classic.replace(
    /(\s(?:src|href)\s*=\s*)(["']?)([^"'\s>]+)\2/gi,
    (_match, prefix, quote, url) => `${prefix}${quote}${resolveUrl(url)}${quote}`,
  );
}

function toRelativeUrl(url) {
  if (/^(?:[a-z][a-z0-9+.-]*:|data:|#)/i.test(url) || url.startsWith("//")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `.${url}`;
  }
  if (url.startsWith("./") || url.startsWith("../")) {
    return url;
  }
  return `./${url}`;
}

function resolveScriptUrl(url, fromDir, distUiDir) {
  const clean = url.split(/[?#]/)[0];
  const suffix = url.slice(clean.length);
  if (/^(?:[a-z][a-z0-9+.-]*:|data:|#)/i.test(clean) || clean.startsWith("//")) {
    return url;
  }
  const base = path.basename(clean);
  if (existsSync(path.join(fromDir, base))) {
    return `./${base}${suffix}`;
  }
  if (!existsSync(distUiDir)) {
    return toRelativeUrl(url);
  }
  for (const entry of readdirSync(distUiDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const absolute = path.join(distUiDir, entry.name, base);
    if (!existsSync(absolute)) continue;
    let relative = path.relative(fromDir, absolute).split(path.sep).join("/");
    if (!relative.startsWith(".")) relative = `./${relative}`;
    return `${relative}${suffix}`;
  }
  return toRelativeUrl(url);
}

export async function postProcessDistUi(distUiDir = path.join(process.cwd(), "dist", "ui")) {
  let entries;
  try {
    entries = await fs.readdir(distUiDir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  const htmlPaths = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const htmlPath = path.join(distUiDir, entry.name, "index.html");
    let html;
    try {
      html = await fs.readFile(htmlPath, "utf8");
    } catch (error) {
      if (error && error.code === "ENOENT") continue;
      throw error;
    }
    const fromDir = path.dirname(htmlPath);
    const next = rewriteWebviewHtml(html, (url) => resolveScriptUrl(url, fromDir, distUiDir));
    if (next !== html) {
      await fs.writeFile(htmlPath, next, "utf8");
    }
    htmlPaths.push(htmlPath);
  }

  await removeUnreferencedScripts(distUiDir, htmlPaths);
}

function referencedLocalFiles(html) {
  const refs = new Set();
  const attr = /\b(?:src|href)\s*=\s*(["']?)([^"'\s>]+)\1/gi;
  let match = attr.exec(html);
  while (match) {
    const url = match[2].split(/[?#]/)[0];
    if (!/^(?:[a-z][a-z0-9+.-]*:|data:|#)/i.test(url) && !url.startsWith("//")) {
      refs.add(url);
    }
    match = attr.exec(html);
  }
  return refs;
}

async function removeUnreferencedScripts(distUiDir, htmlPaths) {
  const referenced = new Set();
  for (const htmlPath of htmlPaths) {
    const html = await fs.readFile(htmlPath, "utf8");
    const dir = path.dirname(htmlPath);
    for (const url of referencedLocalFiles(html)) {
      referenced.add(path.resolve(dir, url));
    }
  }

  async function walk(dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const full = path.join(dir, file.name);
      if (file.isDirectory()) {
        await walk(full);
        continue;
      }
      if (file.name.endsWith(".js") && !referenced.has(full)) {
        await fs.unlink(full);
        continue;
      }
      if (file.name.endsWith(".js.map") && !referenced.has(full.slice(0, -".map".length))) {
        await fs.unlink(full);
      }
    }
  }

  await walk(distUiDir);
}

const isCli =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCli) {
  postProcessDistUi().catch((error) => {
    console.error("[postprocess-webviews] Failed to post-process dist/ui:", error);
    process.exit(1);
  });
}
