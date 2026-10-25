---
name: quiz-lead-site
description: 做一個「線上測驗 → 填 email 換結果 → 收集名單 → 後台匯出」的網站（Next.js App Router＋MongoDB＋LLM 分析＋單一管理員）。當使用者說「做一個測驗網站」「做個小測驗」「心理測驗／人格測驗／性向測驗網站」「quiz 收集名單」「填問卷換結果」「做一個有分數結果的測驗」「留下 email 才看得到結果」「做一個收集 email 的 landing page」「報名頁收集 email」「測驗結果順便存名單」「做個 lead magnet 測驗」「做一個有後台的名單收集網站」「想收集潛在客戶名單」時使用。也適用於「已經有題目，幫我做成網站並存進資料庫」「測驗做完要看得到後台名單、可以下載 Excel」這類需求。涵蓋題庫資料檔、AI 分析 API（三態）、名單 upsert、管理員登入、後台名單與 Excel 匯出、Vercel 上線與限流，以及 12 個實測踩坑。
---

# 測驗型名單收集網站（quiz → lead → AI 分析 → 後台）

一套已走完、可重複套用的流程：使用者答 8 題 → 填 email → AI 產生個人化分析 → 名單進資料庫 → 後台可看可匯出。

## 什麼時候用

- 想做「幾個題目 → 填 email 換結果」的行銷／招生／活動頁
- 需要後台看名單、匯出 Excel，但**不需要註冊、不需要多管理員**
- 題目固定、可以用程式碼維護（不是 CMS）

**不適用**：多管理員與權限分級、金流、題目要在後台新增修改（那需要 CMS／資料庫題庫）。

## 固定技術選擇（除非使用者另有指定）

| 層 | 選擇 | 理由 |
|---|---|---|
| 前端 | Next.js App Router＋TypeScript＋Tailwind | 一套 repo 同時做頁面與 API |
| 資料庫 | MongoDB Atlas＋Mongoose | email 當唯一鍵，upsert 天然適合「重填即更新」 |
| LLM | OpenAI 相容端點（OpenRouter 或 OpenCode），模型 `deepseek-v4.1-flash` | 換供應商只改環境變數 |
| 認證 | 單一管理員＋scrypt 密碼＋JWT 放 httpOnly cookie | 不需要 session 表，也不必註冊流程 |
| 部署 | Vercel（連動 GitHub 自動部署） | 免維運、有 HTTPS |

## 八個階段（每階段結束都要能驗收，不要一次做完才測）

### 0. 需求鎖定（先問，不要自己假設）

1. 主題與題數（預設 8 題 × 4 選項）
2. 風格／結果有幾種？（預設 4 種，每種要有名稱＋一句話＋優勢＋盲點）
3. 要不要 email？要的話**沒填不能看結果**
4. 後台要看到什麼？（預設 Email／風格代號／填答時間＋Excel）
5. 要不要 AI 分析？字數上限（預設 300 字）

### 1. 專案落地

- **程式碼一定放本機**（例如 `C:\dev\<ascii-name>`）。Google Drive 虛擬磁碟不能跑 `npm install`，也不支援 junction。
- 資料夾與 npm 名稱用 ASCII。
- 建立：`npx create-next-app@latest <name> --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`

### 2. 題庫（單一資料檔，不進資料庫）

`src/data/questions.ts` 一個檔案包含：`meta`（標題／副標／slug）、`styles`（結果文案）、`questions`（題目＋選項＋權重）。

```ts
export type StyleId = "planner" | "intuitive" | "pragmatic" | "craftsman";
export interface Option { id: string; label: string; scores: Partial<Record<StyleId, number>> }
```

規則：
- 選項 id 用 `q3c` 這種「題號＋選項」格式，直接存進 `answers`
- 每題四個選項、四種風格都要有人給分（否則某種風格永遠拿不到）
- **同分時以 `styles` 陣列順序在前者優先**（寫進檔頭註解）
- 風格代號由**本地計分**決定，不交給模型猜

### 3. 資料模型

`Lead`（`leads`）：`email`（唯一索引、lowercase、trim）、`answers`（Mixed）、`result`、`resultType`、`createdAt`、`versionKey: false`。

`Admin`（`admins`）：`email`（唯一）、`passwordHash`、`tokenVersion`（登出撤銷用）、`lastLoginAt`。

`RateLimit`（`rate_limits`）：`key`（route＋雜湊 IP）、`count`、`resetAt`（建 TTL 索引）。

- Mongo 單例連線放 `src/lib/mongodb.ts`，快取掛 `globalThis`，**URI 在呼叫時才讀**（CLI 腳本先載 `.env.local` 才拿得到）。
- 開發初期用 `runValidators: true`＋`setDefaultsOnInsert: true`。

### 4. AI 分析 API（`POST /api/analyze`）

- 供應商抽一層：`LLM_PROVIDER=openrouter|opencode`，金鑰只讀伺服器端環境變數
- 輸入 `{ answers, wait?: boolean }`；`wait: true` 直接等結果（方便 curl 驗證），否則回 202＋`jobId` 讓前端輪詢
- **三態**：`pending`／`success`／`failed`，失敗要回可讀中文原因與 `code`
- 輸出 `{ style, styleName, analysis, charCount, scores }`，**analysis 強制 ≤300 字**（模型超長就截到最近句號）
- 推理型模型會把 token 花在 reasoning 上導致正文為空 → **自動加倍 `max_tokens` 重試一次**
- 任務放記憶體（10 分鐘 TTL）即可；要上線多 instance 再換 DB／Redis

### 5. 名單 API（`POST /api/leads`）

- 輸入 `{ email, answers, result, resultType }`
- Email 驗證：長度 ≤254、不能有空白、**剛好一個 `@`**、網域要有點；存檔前 `lowercase`
- **同 email 重填要更新，不是新增**：`findOneAndUpdate({ email }, { $set }, { upsert: true, returnDocument: "after", includeResultMetadata: true })`
  - `createdAt` 保留第一次時間
  - 併發撞 `E11000` 時重試一次即可視為更新
- 回 201（新增）／200（更新）／400（逐條列出哪個欄位錯）

### 6. 前端流程（單頁狀態機最省事）

`intro → quiz → email → submitting → result ／ error`

- 一次一題、選完 0.2 秒自動下一題、有進度條
- 答完第 8 題才出現 email 欄位
- **沒填 email 不能送出、也就看不到結果**（結果只在前端拿到 `success` 後才 render）
- Loading 要有轉圈＋已等秒數，**不能白畫面**
- 錯誤頁要顯示可讀原因、`code`、`details`，並有「重試／重新開始」
- 非 JSON 回應（伺服器 500 HTML）要攔下來變成可讀訊息
- 名單儲存失敗**不阻擋顯示結果**，只在結果頁顯示提示

版面：≥1024px 左題目（sticky）／右選項，以下單欄；容器 `max-w` 依階段切換（答題寬、結果窄）。全域 `min-h-dvh`＋`overflow-x: clip`，不要用 `background-attachment: fixed`。

### 7. 管理員與後台

- 密碼 `scrypt`（Node 內建即可，不必裝 bcrypt），格式 `scrypt$N$r$p$salt$hash`
- 登入成功簽 JWT（HS256、7 天）放 **httpOnly cookie**；`sameSite=lax`、production 加 `secure`
- **登出要真的撤銷**：`Admin.tokenVersion` +1，驗證時比對 JWT 的 `ver`
- 一次性建帳號：`npm run admin:create -- <email> "<密碼>" [--force]`
  - 只允許一個管理員，`--force` 是更新同一筆
  - **拒絕非 ASCII email**（避免把範例文字「你的」一起貼進去）
- 後台頁：伺服器端先驗登入（未登入導向登入頁），列表分頁，**沒有資料時下載按鈕 disable**
- Excel：後端用 `xlsx` 產生（欄位：Email／風格／填答時間），檔名 `leads-YYYY-MM-DD.xlsx`（台北時區）

### 8. 上線與防護

1. `vercel link --yes --project <name>` → 專案建立並連動 GitHub
2. 環境變數（Production＋Preview）：`MONGODB_URI`、`JWT_SECRET`、`LLM_PROVIDER`、`OPENROUTER_API_KEY`（或 `OPENCODE_API_KEY`）
3. Atlas Network Access 要放行 Vercel
4. **公開 API 要限流**（見下），否則 `/api/analyze` 會被灌爆燒 token
5. 上線後驗收：首頁 200、`/api/admin/leads` 未登入 401、`/api/leads` 201、`/api/analyze` success、429 會出現

**限流做法**：MongoDB 固定時間窗（serverless 每個 instance 記憶體獨立，記憶體限流等於沒有限制）。IP **只存 SHA-256 雜湊**，`resetAt` 建 TTL 索引自動清除；資料庫異常時 fail-open；429 要附 `Retry-After` 與中文原因。建議值：analyze 12/小時、leads 30/小時、登入 5/5 分鐘。

## 12 個實測踩坑（會直接卡住的那種）

1. **Google Drive 虛擬磁碟不能開發**：`npm install` 會 `EBADF`／`EPERM`，也不支援 junction／symlink。`fsutil fsinfo volumeinfo X:` 看到非 NTFS 就別用。
2. **中文資料夾名不能當 npm 名稱**：`create-next-app .` 會說 `name can only contain URL-friendly characters`。
3. **Next 16 `cacheComponents`**：route/page 不能寫 `export const runtime`／`dynamic`（編譯錯誤）；`/admin` 這種要讀 cookie 的頁面加 `export const instant = false`。
4. **`/admin` 未登入回 200 而不是 307**：Next 會先送靜態外殼再由前端轉址。瀏覽器正常跳轉、API 仍 401；`await connection()` 無法改變，不要白費力氣。
5. **Mongoose 9 pipeline 更新要 `updatePipeline: true`**，否則丟 `Cannot pass an array to query updates`；若限流 fail-open 會**整組靜默失效**（要去看 log）。
6. **Mongoose 9 `new: true` 已棄用** → 改 `returnDocument: "after"`。
7. **Vercel 第一次部署直接進 Production**（CLI 會提示），不是 preview。
8. **`xlsx` 不要用 npm registry 0.18.5**（有已知漏洞），裝官方 CDN 版：`npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`。
9. **OpenCode API Key 過期無法自助續期**（`api_key_expired`，重新登入也沒用），要回 Console 重新產生；Key 過期時可切 OpenRouter 應急。
10. **推理型模型會吃掉 token 導致正文為空**（`finish_reason: length`）→ 自動加倍重試。
11. **純 JWT 的登出只清 cookie**，複製走的 token 仍有效 → 用 `tokenVersion` 才是真撤銷。
12. **PowerShell 寫 JSON 會加 BOM**，害 `package.json` 解析失敗 → 用編輯工具寫檔，別用 `Set-Content`。

## 驗收清單（做完逐項打勾）

- [ ] 沒填 email／格式錯 → 看不到結果
- [ ] 同一個 email 重填 → 200 updated、id 不變、`createdAt` 保留
- [ ] 答 8 題會自動跳題、可回上一題、進度條正確
- [ ] Loading 有秒數、錯誤頁有可讀原因與 `code`
- [ ] 登出後用舊 cookie 打 API → 401
- [ ] 未登入開 `/admin` → 導到登入頁
- [ ] Excel 檔名帶日期、三個欄位、資料筆數正確
- [ ] 沒資料時下載按鈕 disable、API 回 404
- [ ] 連續打公開 API → 429 且有 `Retry-After`
- [ ] 375／768／1024／1366 寬度都無橫向捲軸
- [ ] `tsc --noEmit`、`lint`、`build` 全過

## 換主題／換規模時

- **換測驗主題**：只改 `src/data/questions.ts`（標題、風格文案、題目與權重）
- **風格從 4 種變 3 或 5 種**：改 `styles` 長度＋每題權重；同分規則不變
- **改成活動報名**：把 quiz 拿掉，只留 email 欄位，`result` 改存活動代號
- **要多人管理**：`Admin` 加 `role`，把 `tokenVersion` 改為 per-session 表

## 參考實作

- `jobehsieh/lead-collection-web`（私有）：本流程的完整實作，含題庫、兩支公開 API、管理員、後台、Excel、限流與紙條風格 UI。
