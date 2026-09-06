import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const distDir = join(projectDir, "dist", "client");
const outputPath = join(projectDir, "Компас рекрутера — прототип.html");
const previewPath = join(distDir, "standalone.html");

const mimeByExtension = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

async function dataUrl(path) {
  const bytes = await readFile(path);
  const mime = mimeByExtension[extname(path).toLowerCase()] ?? "application/octet-stream";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function inlineCssAssets(css, cssPath) {
  const matches = [...css.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)];
  let result = css;

  for (const match of matches) {
    const reference = match[2];
    if (reference.startsWith("data:") || reference.startsWith("http")) continue;
    const assetPath = reference.startsWith("/")
      ? join(distDir, reference.slice(1))
      : resolve(dirname(cssPath), reference);
    result = result.replaceAll(match[0], `url("${await dataUrl(assetPath)}")`);
  }

  return result;
}

async function writeIfChanged(path, content) {
  try {
    if (await readFile(path, "utf8") === content) return false;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(path, content, "utf8");
  return true;
}

let html = await readFile(join(distDir, "index.html"), "utf8");

const stylesheetMatch = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if (!stylesheetMatch) throw new Error("Не найден собранный файл стилей");
const cssPath = join(distDir, stylesheetMatch[1].replace(/^\//, ""));
const css = await inlineCssAssets(await readFile(cssPath, "utf8"), cssPath);
html = html.replace(stylesheetMatch[0], () => `<style>${css}</style>`);

const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
if (!scriptMatch) throw new Error("Не найден собранный JavaScript");
const jsPath = join(distDir, scriptMatch[1].replace(/^\//, ""));
let js = await readFile(jsPath, "utf8");

for (const assetName of ["hero-route-map.png", "pavel-andreev.png", "anna-kovalyova.png"]) {
  const reference = `/assets/${assetName}`;
  js = js.replaceAll(reference, await dataUrl(join(distDir, "assets", assetName)));
}

html = html.replace(
  scriptMatch[0],
  () => `<script type="module">${js.replaceAll("</script>", "<\\/script>")}</script>`,
);

const changed = await writeIfChanged(outputPath, html);
await writeIfChanged(previewPath, html);
console.log(`${changed ? "Создан" : "Проверен без изменений"} самостоятельный HTML: ${outputPath}`);
