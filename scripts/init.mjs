#!/usr/bin/env node
/**
 * Interactive init script — personalizes the starter kit for your plugin.
 *
 * Usage:  pnpm run init
 *         node scripts/init.mjs
 *
 * Prompts for plugin name, identifier, author, and description,
 * then rewrites Info.json, package.json, and README.md in place.
 */
import { createInterface } from "node:readline/promises";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(question, fallback = "") {
  const answer = await rl.question(`${question} ${fallback ? `(${fallback}) ` : ""}`);
  return answer.trim() || fallback;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("\n🔌 IINA Plugin Starter — Init\n");

  const pluginName = await ask("Plugin name:", "My IINA Plugin");
  const slug = slugify(pluginName);
  const identifier = await ask("Bundle identifier:", `com.example.${slug}`);
  const description = await ask("Description:", "An IINA plugin built with React and TypeScript.");
  const authorName = await ask("Author name:", "");
  const authorEmail = await ask("Author email:", "");
  const githubUser = await ask("GitHub username:", "");
  const repo = `${githubUser || "yourusername"}/${slug}`;

  // ── Rewrite Info.json ───────────────────────────────────────────────────────
  const infoPath = resolve(ROOT, "Info.json");
  const info = JSON.parse(readFileSync(infoPath, "utf-8"));
  info.name = pluginName;
  info.identifier = identifier;
  info.description = description;
  if (authorName) info.author.name = authorName;
  if (authorEmail) info.author.email = authorEmail;
  if (githubUser) info.author.url = `https://github.com/${githubUser}`;
  info.ghRepo = repo;
  info.sidebarTab.name = pluginName;
  writeFileSync(infoPath, JSON.stringify(info, null, 2) + "\n");
  console.log("  ✔ Info.json");

  // ── Rewrite package.json ────────────────────────────────────────────────────
  const pkgPath = resolve(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.name = slug;
  pkg.description = description;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("  ✔ package.json");

  // ── Rewrite README.md ──────────────────────────────────────────────────────
  const readmePath = resolve(ROOT, "README.md");
  if (existsSync(readmePath)) {
    let readme = readFileSync(readmePath, "utf-8");
    readme = readme.replace(/# iina-plugin-starter/, `# ${slug}`);
    readme = readme.replace(/yourusername\/iina-plugin-starter/g, repo);
    readme = readme.replace(/yourusername\/my-iina-plugin/g, repo);
    readme = readme.replace(/my-plugin/g, slug);
    writeFileSync(readmePath, readme);
    console.log("  ✔ README.md");
  }

  // ── Rewrite CONTRIBUTING.md ─────────────────────────────────────────────────
  const contribPath = resolve(ROOT, "CONTRIBUTING.md");
  if (existsSync(contribPath)) {
    let contrib = readFileSync(contribPath, "utf-8");
    contrib = contrib.replace(/yourusername\/iina-plugin-starter/g, repo);
    writeFileSync(contribPath, contrib);
    console.log("  ✔ CONTRIBUTING.md");
  }

  console.log(`\n🎉 Done! Your plugin "${pluginName}" is ready.\n`);
  console.log("Next steps:");
  console.log("  pnpm install");
  console.log("  pnpm run build");
  console.log("  pnpm run link\n");

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
