/**
 * favicon 樣板生成器（純 SVG，不需任何依賴）
 *
 * 用法：
 *   1. 改下面的 SITES（站名、網域、字母、主色、圖示）
 *   2. node generate.mjs
 *   3. 產出：<OUT>/svg/<slug>-{monogram,glyph,combo}.svg 與 <OUT>/index.html 預覽頁
 *   4. 選定風格後跑 rasterize.mjs 產生 favicon.ico 與 apple-icon.png
 *
 * 圖示可選：chat / snow / cap / contract / pencil / wallet / people / lotus
 * 新增圖示：在 GLYPHS 加一條 64×64 的 path（線稿、stroke 由程式統一給）。
 */

import fs from "node:fs";
import path from "node:path";

// ── 設定 ────────────────────────────────────────────────────────────────
const OUT = path.resolve("./out");

const SITES = [
  {
    slug: "my-site",
    name: "我的新網站",
    domain: "my-site.vercel.app",
    letter: "我",
    color: "#047857",
    dark: "#064e3b",
    glyph: "chat",
    suggest: "monogram", // monogram | glyph | combo
    note: "為什麼用這個字／這個圖示",
  },
];
// ────────────────────────────────────────────────────────────────────────

const FONT =
  "'Microsoft JhengHei','PingFang TC','Noto Sans TC',system-ui,-apple-system,'Segoe UI',sans-serif";

const GLYPHS = {
  chat: `
    <path d="M16 17h32a6 6 0 0 1 6 6v13a6 6 0 0 1-6 6H31l-9 8v-8h-6a6 6 0 0 1-6-6V23a6 6 0 0 1 6-6z" />
    <circle cx="24" cy="29.5" r="2.6" fill="currentColor" stroke="none" />
    <circle cx="32" cy="29.5" r="2.6" fill="currentColor" stroke="none" />
    <circle cx="40" cy="29.5" r="2.6" fill="currentColor" stroke="none" />`,
  snow: `
    <path d="M32 10v44M13.5 21.5l37 21M50.5 21.5l-37 21" />
    <path d="M32 16l-4.5-4.5M32 16l4.5-4.5M32 48l-4.5 4.5M32 48l4.5 4.5" />`,
  cap: `
    <path d="M8 26 32 14l24 12-24 12z" />
    <path d="M19 33v9c0 4.5 26 4.5 26 0v-9" />
    <path d="M52 29v11" />`,
  contract: `
    <path d="M18 11h18l10 10v32H18z" />
    <path d="M36 11v10h10" />
    <path d="M24 34l5 5 11-11" />
    <path d="M24 45h16" />`,
  pencil: `
    <path d="M13 51l3.5-12L39 16.5l9 9L25.5 48z" />
    <path d="M37 19l9 9M16.5 39l9 9" />`,
  wallet: `
    <path d="M14 22h32a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5z" />
    <path d="M14 30h22" />
    <circle cx="43" cy="38" r="4.5" />`,
  people: `
    <circle cx="20" cy="26" r="6" />
    <circle cx="44" cy="26" r="6" />
    <circle cx="32" cy="22" r="7" />
    <path d="M8 50c1.5-8 6-12 12-12s10.5 4 12 12" />
    <path d="M56 50c-1.5-8-6-12-12-12s-10.5 4-12 12" />`,
  lotus: `
    <path d="M32 13c4.5 5.5 6.5 10.5 6.5 15.5S36 38 32 41c-4-3-6.5-7.5-6.5-12.5S27.5 18.5 32 13z" />
    <path d="M18 24c5.5 1.5 9.5 4.5 11.5 8.5S31 41 30 44c-4-1-7-4-9-8s-3-8-3-12z" />
    <path d="M46 24c-5.5 1.5-9.5 4.5-11.5 8.5S33 41 34 44c4-1 7-4 9-8s3-8 3-12z" />
    <path d="M12 39c4 8 11 12 20 12s16-4 20-12" />`,
};

const gradient = (id, color, dark) => `
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${color}" />
        <stop offset="1" stop-color="${dark}" />
      </linearGradient>
    </defs>`;

const aria = (site) => `role="img" aria-label="${site.name}"`;

function monogram(site, id) {
  const size = /[A-Za-z]/.test(site.letter) ? 38 : 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${aria(site)}>
  <title>${site.name}</title>${gradient(id, site.color, site.dark)}
  <rect width="64" height="64" rx="15" fill="url(#${id})" />
  <rect x="1.5" y="1.5" width="61" height="61" rx="13.5" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.5" />
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#ffffff" letter-spacing="0.5">${site.letter}</text>
</svg>`;
}

function glyph(site, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${aria(site)}>
  <title>${site.name}</title>${gradient(id, site.color, site.dark)}
  <rect width="64" height="64" rx="15" fill="url(#${id})" />
  <g fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" color="#ffffff">
    ${GLYPHS[site.glyph]}
  </g>
</svg>`;
}

function combo(site, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${aria(site)}>
  <title>${site.name}</title>${gradient(id, site.color, site.dark)}
  <rect width="64" height="64" rx="15" fill="#ffffff" />
  <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="${site.color}" stroke-opacity="0.22" stroke-width="2" />
  <text x="26" y="36" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="30" font-weight="700" fill="${site.color}">${site.letter}</text>
  <circle cx="49" cy="17" r="11" fill="url(#${id})" />
  <g transform="translate(49 17) scale(0.34) translate(-32 -32)" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" color="#ffffff">
    ${GLYPHS[site.glyph]}
  </g>
</svg>`;
}

const STYLES = [
  { key: "monogram", label: "字母縮寫", build: monogram },
  { key: "glyph", label: "概念圖示", build: glyph },
  { key: "combo", label: "字母＋圖示", build: combo },
];

const svgDir = path.join(OUT, "svg");
fs.mkdirSync(svgDir, { recursive: true });

const rendered = SITES.map((site) => {
  const variants = STYLES.map((style) => {
    const svg = style.build(site, `${site.slug}-${style.key}`).trim();
    const file = `${site.slug}-${style.key}.svg`;
    fs.writeFileSync(path.join(svgDir, file), `${svg}\n`, "utf8");
    return { ...style, file, svg };
  });
  return { site, variants };
});

const card = ({ site, variants }) => `
      <section class="site">
        <header>
          <div class="title-row"><h2>${site.name}</h2><span class="dot" style="background:${site.color}"></span></div>
          <p class="domain">${site.domain}</p>
          <p class="note">${site.note}　主色 <code>${site.color}</code></p>
        </header>
        <div class="variants">
          ${variants
            .map(
              (variant) => `
          <div class="variant${variant.key === site.suggest ? " picked" : ""}">
            ${variant.key === site.suggest ? '<span class="pill">建議</span>' : ""}
            <div class="sizes">
              <span class="s64">${variant.svg}</span>
              <span class="s32">${variant.svg}</span>
              <span class="s16">${variant.svg}</span>
            </div>
            <p class="style-name">${variant.label}</p>
            <a class="btn" href="svg/${variant.file}" download>下載 SVG</a>
            <code>${variant.file}</code>
          </div>`,
            )
            .join("")}
        </div>
      </section>`;

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>favicon 樣板</title>
<style>
  :root { --ink:#0f172a; --muted:#64748b; --line:rgba(15,23,42,.10); --paper:#f7f6f3; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font-family:${FONT}; line-height:1.7; }
  .wrap { max-width:1120px; margin:0 auto; padding:48px 24px 88px; }
  h1 { font-size:28px; margin:0 0 6px; }
  .hint { margin-top:16px; padding:14px 18px; border-radius:16px; background:#fff; border:1px solid var(--line); font-size:13.5px; color:#334155; }
  .site { margin-top:30px; background:#fff; border:1px solid var(--line); border-radius:22px; padding:22px; }
  .title-row { display:flex; align-items:center; gap:10px; }
  .title-row h2 { font-size:17px; margin:0; }
  .dot { width:10px; height:10px; border-radius:999px; }
  .domain, .note { margin:2px 0 0; font-size:12.5px; color:var(--muted); }
  .variants { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:16px; }
  .variant { border:1px solid var(--line); border-radius:16px; padding:16px; display:flex; flex-direction:column; align-items:center; gap:9px; background:#fcfcfb; position:relative; }
  .variant.picked { border-color:rgba(4,120,87,.45); background:#f6fbf8; box-shadow:0 0 0 3px rgba(4,120,87,.07); }
  .pill { position:absolute; top:-10px; left:14px; font-size:10.5px; font-weight:700; background:#047857; color:#fff; border-radius:999px; padding:2px 9px; }
  .sizes { display:flex; align-items:flex-end; gap:14px; height:68px; }
  .s64 svg { width:64px; height:64px; display:block; }
  .s32 svg { width:32px; height:32px; display:block; }
  .s16 svg { width:16px; height:16px; display:block; }
  .style-name { margin:0; font-size:13px; font-weight:700; }
  .btn { font-size:12px; padding:6px 12px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink); text-decoration:none; }
  code { font-size:11px; color:var(--muted); background:rgba(15,23,42,.04); padding:2px 6px; border-radius:6px; }
  @media (max-width:860px) { .variants { grid-template-columns:1fr; } }
</style>
</head>
<body>
  <div class="wrap">
    <h1>favicon 樣板</h1>
    <p class="note">每站三種風格；<b>16px 才是分頁上的真實大小</b>，請以它為準。</p>
    <div class="hint">選定後把該檔改名 <code>icon.svg</code> 放進專案的 <code>app/</code> 或 <code>src/app/</code>，再跑 <code>rasterize.mjs</code> 產生 <code>favicon.ico</code> 與 <code>apple-icon.png</code>。</div>
${rendered.map(card).join("\n")}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, "index.html"), html, "utf8");
console.log(`OK：${SITES.length} 站、${SITES.length * STYLES.length} 個 SVG`);
console.log(`預覽：${path.join(OUT, "index.html")}`);
