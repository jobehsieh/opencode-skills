# OpenCode 全域技能集（skills）

本 repo 是 **`~/.config/opencode/skills/`** 的版本備份。每個子資料夾是一支 OpenCode 技能（skill）：資料夾名稱＝技能 ID，內含 `SKILL.md`（frontmatter 的 `name`／`description` 決定何時被觸發）與選用的 `references/`、`scripts/`、`assets/`。

用途：**跨電腦備份與還原**。換電腦時不必重新摸索或重寫技能。

---

## 還原到新電腦

```bash
# 目標目錄必須先不存在或為空
git clone https://github.com/jobehsieh/opencode-skills.git "$HOME/.config/opencode/skills"
```

Windows（PowerShell）：

```powershell
git clone https://github.com/jobehsieh/opencode-skills.git "$env:USERPROFILE\.config\opencode\skills"
```

> 若該目錄已有內容（例如內建技能），先把原內容備份到別處，clone 後再補回缺少的部分，避免覆蓋。

> **這個目錄不受 chezmoi 管理**：`dotfiles` 的 `.chezmoiignore` 已排除 `.config/opencode/skills`
> （原因：它本身是 git repo，若 chezmoi 再複製一份，改技能文件後 `chezmoi apply` 會把實際檔案蓋回舊版）。
> 換電腦的順序是：先 `chezmoi init --apply jobehsieh/dotfiles`，再 git clone 本 repo 到
> `~/.config/opencode/skills`。改技能時**只需要**推這個 repo，不必再 `chezmoi add`。

---

## 技能一覽

| 技能 | 用途 |
|---|---|
| `agent-global-config` | 全域工作規範：說「用語音回答」時以 Edge-TTS 行內語音回覆；工作結束或需要你介入時的自動語音通知；說「開工／收工」時觸發同步流程 |
| **`book-project`** | **非虛構書籍的完整創作流程（實戰版）**：作者動機訪談、出書企劃、章節企劃卡、素材台帳、逐章寫作、補訪與授權、統稿與去重、讀者需求驗證、出版提案與上市；另含跨 Agent／跨電腦三層同步（AGENTS.md＋handoff.md＋Git＋筆記）與內容工具鏈（Markdown 為正本、docx／PDF 轉製、雲端硬碟陷阱） |
| `claude-video-specs` | 三類影片製作規範與自動 bootstrap 流程（活動紀錄 01／教學 02／社群科普 03） |
| `find-skills` | 協助尋找與安裝可用的技能（「有沒有可以做 X 的技能？」） |
| `image-vision-sidecar` | 讓純文字模型（DeepSeek、GLM 等無視覺模型）間接讀圖：用 Groq Vision API 把 PNG／JPG／PDF／PPTX／DOCX 轉成繁體中文 Markdown 描述 |
| `photo-composition-critic` | 攝影構圖與美學評論（依 AVA／NIMA／LAION-Aesthetics 等計算美學研究） |
| `photo-slideshow` | 把照片做成影片：Ken Burns 運鏡、轉場、節拍同步、字幕與開場／結尾卡 |
| `project-init` | 專案初始化（L1 本地 AGENTS.md＋handoff.md／L2 GitHub／L3 Obsidian 三層級自動偵測） |
| `rdq` | RDQ 需求探索四象限訪談（OpenCode 版）：動工「之前」做結構化訪談，產出一頁需求規格卡 |
| `shutdown` | 收工同步助手：更新 `AGENTS.md` 進度與 `handoff.md`、commit＋push、寫入詳細筆記 |
| `startup` | 開工接續助手：讀 `AGENTS.md` 與 `handoff.md`、檢查 git 狀態（含 fetch）、建議下一步 |
| `strategy-optimizer` | 量化策略優化代理（透過 Trader Dev MCP 搜尋、分叉、改進、回測並保留穩健版本） |
| `taigi-asr` | 臺灣閩南語（台語）語音轉文字：用 MediaTek Breeze-ASR-26＋faster-whisper，可輸出 txt／srt／vtt／json。**只含程式與說明**，`.venv` 與模型（約 2.9 GB）須在新電腦另行下載 |
| `trading-script-writer` | 交易策略程式碼產生：Pine Script v6（TradingView）／MultiCharts PowerLanguage／XQ XScript |
| `voice-permission` | 語音權限通知的設計規範（功能已由 `voice-permission` plugin 自動處理，技能留作規格文件） |

---

## 不在這個 repo 的東西（換電腦時要另外處理）

| 項目 | 位置 | 說明 |
|---|---|---|
| OpenCode 主設定 | `~/.config/opencode/opencode.jsonc` | 模型、plugins、MCP 伺服器（含 obsidian 的啟動指令與環境變數）；**可能含本機路徑**，未納入本 repo |
| Obsidian MCP 修補 | `~/.config/opencode/mcp/obsidian-linkfix.mjs` | 修 Google 雲端硬碟不支援 hard link 的問題（沒有它，MCP 新建筆記會失敗） |
| Plugins | `~/.config/opencode/plugins/` | 例如 `voice-permission.ts` |
| 指示檔 | `~/.config/opencode/instructions/` | 語音輸入正規化、語音回覆等 |
| 台語 ASR 的環境 | `~/.config/opencode/skills/taigi-asr/.venv` 與 Hugging Face 快取 | 技能程式與 `SKILL.md` 已在 repo 內；但 `.venv` 與模型（約 2.9 GB）被 `.gitignore` 排除，換電腦後要依 `taigi-asr/SKILL.md` 的「環境重建」段重裝 |
| 憑證與金鑰 | 各專案的 `.env` | 一律不進任何 repo |

---

## 維護方式

改完任何技能後：

```bash
cd ~/.config/opencode/skills
git add -A
git commit -m "<動詞＋對象：一句話講清楚改了什麼>"
git push
```

新增技能：

1. 建立資料夾 `skills/<skill-id>/`。
2. 寫 `SKILL.md`，frontmatter 至少要有 `name` 與 `description`（**description 決定觸發時機**：要寫清楚「做什麼」＋「什麼情況下用」，並把觸發詞寫進去）。
3. 細節放 `references/`（分層載入，避免每次觸發都吃滿 context）。
4. commit＋push。

`.gitignore` 會排除 `.venv/`、`node_modules/`、`__pycache__/`、`dist/`、`build/` 等產生物，避免把模型、依賴或大型輸出推上去。

---

## 隱私

本 repo 目前為**公開**。推之前請確認沒有：API key、密碼、金鑰、個資（姓名／Email／電話／地址）、憑證檔。技能文件本身應只描述「怎麼做」，不應包含真實憑證或可辨識個人的資料。
