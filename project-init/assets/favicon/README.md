# favicon 三件套工具包

新網站的基本設定之一。規範本體在 `agent-global-config` 技能第六節，這裡只放可直接執行的工具。

## 一、為什麼一定要做

框架預設的 favicon（Next.js／Vercel 的三角形）會讓每一站看起來都一樣，分頁一多就分不出來。品牌 favicon 是**交付的基本門面**，不是加分項。

## 二、產出三個檔

| 檔案 | 尺寸 | 給誰用 |
|---|---|---|
| `icon.svg` | 向量 64×64 畫布 | Chrome／Edge／Firefox 分頁 |
| `favicon.ico` | 16／32／48 | Safari、舊瀏覽器、Windows 捷徑、書籤 |
| `apple-icon.png` | 180×180 | iOS 加到主畫面、Safari 書籤 |

## 三、步驟

```powershell
# 1) 產生候選樣式（純 SVG，不需安裝任何東西）
#    打開 generate.mjs 最上面的 SITES，填入站名／字母／主色／圖示
node generate.mjs
#    → out/svg/*.svg 與 out/index.html（預覽頁，含 16px 實寸）

# 2) 選定風格後，把檔案改名 icon.svg 放進專案
#    Next.js：app/ 或 src/app/（monorepo 如 web-platform/src/app/）
#    同時刪掉框架預設的 app/favicon.ico

# 3) 點陣化（需要 sharp 與 png-to-ico）
mkdir $env:TEMP\favicon-tools; cd $env:TEMP\favicon-tools
npm init -y; npm i sharp png-to-ico
node <此資料夾>\rasterize.mjs C:\dev\my-site\src\app

# 4) 部署後驗收
#    首頁 HTML 要同時有 rel="icon" 指向 /icon.svg 與 /favicon.ico
#    GET /favicon.ico 200 且位元組與本機一致
```

## 四、設計守則

- **一個元素就好**：一個字或一個圖示，不要字＋圖並排（16px 會糊）。
- **16px 是驗收尺寸**：中文筆畫太密（鮮、帳、聚、佛）請改用概念圖示。
- **一站一色**：多站之間避免同色系撞色；深淺用同一色相的 dark 版本做漸層。
- 圓角 15/64、四周留 12% padding、線稿 stroke 3.2（64 畫布）。

## 五、圖示庫

內建：`chat`（對話）、`snow`（冷藏）、`cap`（學術）、`contract`（文件審閱）、`pencil`（書寫）、`wallet`（金錢）、`people`（家庭／人群）、`lotus`（宗教／修行）。

新增圖示：在 `generate.mjs` 的 `GLYPHS` 加一條 64×64 的 path，線稿即可（stroke 由程式統一給）。

## 六、踩過的坑

- **只放 SVG 不夠**：Safari 與 iOS 書籤不吃 SVG favicon，會退回空白或框架預設圖。
- **忘了刪 `app/favicon.ico`**：Next.js 會繼續送舊的三角形，看起來像「沒生效」。
- **瀏覽器 favicon 快取很黏**：部署後 tab 還是舊圖，多半是快取；用 `Ctrl+F5` 或無痕視窗確認，不要急著改程式。
- **monorepo 的 `sync-to-github.ps1` 用 robocopy `/MIR`**：只改本機 repo 的話，下次同步會被雲端來源覆蓋刪除；兩邊都要放。
- **Vercel 專案不一定接 Git 自動部署**：`vercel ls <project>` 若顯示好幾天沒更新，push 完要手動 `vercel deploy --prod`。
- **`vercel link`／`vercel deploy` 會產生 `.env.local`（含 `VERCEL_OIDC_TOKEN`）**：用完立刻刪，別 commit。
