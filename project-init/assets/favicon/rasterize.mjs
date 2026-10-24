/**
 * 把 favicon SVG 點陣化成 favicon.ico 與 apple-icon.png
 *
 * 為什麼要這一步：Safari、iOS 主畫面、Windows 捷徑、部分書籤不支援 SVG favicon，
 * 只放 icon.svg 會有瀏覽器看不到圖示。
 *
 * 安裝依賴（建議在暫存資料夾，不要裝進專案）：
 *   mkdir %TEMP%\favicon-tools && cd %TEMP%\favicon-tools
 *   npm init -y && npm i sharp png-to-ico
 *
 * 用法：
 *   node rasterize.mjs <要處理的資料夾> [--name icon.svg]
 *   例：node rasterize.mjs C:\dev\my-site\src\app
 *       node rasterize.mjs .\out\svg --name my-site-glyph.svg
 *
 * 產出（放在同一個資料夾）：
 *   favicon.ico    16 / 32 / 48 多尺寸
 *   apple-icon.png 180×180
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** 依序在「目前資料夾 → 腳本資料夾 → 系統暫存的 favicon-tools」找依賴 */
function loadDependency(name) {
  const roots = [process.cwd(), here, path.join(os.tmpdir(), "favicon-tools")];
  const errors = [];
  for (const root of roots) {
    try {
      return createRequire(path.join(root, "noop.js"))(name);
    } catch (error) {
      errors.push(`${root}: ${error.message}`);
    }
  }
  console.error(`載入 ${name} 失敗，請先安裝：npm i sharp png-to-ico`);
  console.error(errors.join("\n"));
  process.exit(1);
}

const sharp = loadDependency("sharp");
const pngToIcoModule = loadDependency("png-to-ico");
const pngToIco = pngToIcoModule.default ?? pngToIcoModule.imagesToIco ?? pngToIcoModule;

const [, , targetDir, ...rest] = process.argv;
if (!targetDir) {
  console.error("用法：node rasterize.mjs <資料夾> [--name icon.svg]");
  process.exit(1);
}

const nameIndex = rest.indexOf("--name");
const svgName = nameIndex >= 0 ? rest[nameIndex + 1] : "icon.svg";
const dir = path.resolve(targetDir);
const svgPath = path.join(dir, svgName);

if (!fs.existsSync(svgPath)) {
  console.error(`找不到 ${svgPath}`);
  process.exit(1);
}

const svg = fs.readFileSync(svgPath);
const render = (size) =>
  sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

const png16 = await render(16);
const png32 = await render(32);
const png48 = await render(48);
const png180 = await render(180);
const ico = await pngToIco([png16, png32, png48]);

fs.writeFileSync(path.join(dir, "favicon.ico"), ico);
fs.writeFileSync(path.join(dir, "apple-icon.png"), png180);

console.log(`OK ${dir}`);
console.log(`  favicon.ico    ${ico.length} bytes（16/32/48）`);
console.log(`  apple-icon.png ${png180.length} bytes（180×180）`);
console.log("提醒：Next.js 專案請刪掉 app/favicon.ico 的預設檔，並確認沒有多餘的 icon.png。");
