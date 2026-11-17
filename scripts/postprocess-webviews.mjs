#!/usr/bin/env node
/* global console, process */
/**
 * Make Parcel's webview HTML loadable from IINA's file-backed WKWebView.
 * Keep the classic nomodule bundle, drop the module twin, and use a relative src.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function rewriteWebviewHtml(html) {
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
    (_match, prefix, quote, url) => `${prefix}${quote}${toRelativeUrl(url)}${quote}`,
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

export async function postProcessDistUi(distUiDir = path.join(process.cwd(), "dist", "ui")) {
  const entries = await fs.readdir(distUiDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const htmlPath = path.join(distUiDir, entry.name, "index.html");
    let html;
    try {
      html = await fs.readFile(htmlPath, "utf8");
    } catch (error) {
      if (error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
    const next = rewriteWebviewHtml(html);
    if (next !== html) {
      await fs.writeFile(htmlPath, next, "utf8");
    }
    await removeUnreferencedScripts(path.dirname(htmlPath), next);
  }
}

function referencedLocalFiles(html) {
  const refs = new Set();
  const attr = /\b(?:src|href)\s*=\s*(["']?)([^"'\s>]+)\1/gi;
  let match = attr.exec(html);
  while (match) {
    const url = match[2].split(/[?#]/)[0];
    if (!/^(?:[a-z][a-z0-9+.-]*:|data:|#)/i.test(url) && !url.startsWith("//")) {
      refs.add(url.replace(/^\.\//, "").replace(/^\//, ""));
    }
    match = attr.exec(html);
  }
  return refs;
}

async function removeUnreferencedScripts(dirPath, html) {
  const referenced = referencedLocalFiles(html);
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }
    if (file.name.endsWith(".js") && !referenced.has(file.name)) {
      await fs.unlink(path.join(dirPath, file.name));
      continue;
    }
    if (file.name.endsWith(".js.map")) {
      const jsName = file.name.slice(0, -".map".length);
      if (!referenced.has(jsName)) {
        await fs.unlink(path.join(dirPath, file.name));
      }
    }
  }
}

const isCli =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCli) {
  postProcessDistUi().catch((error) => {
    console.error("[postprocess-webviews] Failed to post-process dist/ui:", error);
    process.exit(1);
  });
}
