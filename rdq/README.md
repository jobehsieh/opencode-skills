# RDQ Method — 需求探索四象限法（OpenCode 版）

**Requirements Discovery Quadrant Method**
一個給 [OpenCode](https://opencode.ai) 用的需求訪談 Skill。

> 在執行之前，先把真正的問題找出來。

> 原始 Claude Code 版：[rdq-skill](https://github.com/mathruffian-dot/rdq-skill)

---

## 這是在解決什麼問題

你請 AI 做一份東西，它做出來了——格式完整、邏輯通順，但**不能用**。

AI 沒有做錯任何被交代的事。問題是：**有太多事，根本沒有被交代。**

常見的解法是「教使用者寫更好的提示詞」。但人本來就不知道自己漏了什麼。

RDQ 換一個方向：**讓 AI 在動手之前，先協助你把需求挖出來。**

---

## 四象限

| 象限 | 英文 | 使用者的狀態 | Agent 該做的事 |
|---|---|---|---|
| **Ⅰ** | Known Knowns | 已經明說的目標與限制 | **擷取**、回顯、確認 |
| **Ⅱ** | Known Unknowns | 知道自己不懂、會主動問 | **解答**、查詢、澄清 |
| **Ⅲ** | Unknown Knowns | 知道卻沒想到要說（學生程度、網路不穩、只有 45 分鐘） | **訪談**、追問 |
| **Ⅳ** | Unknown Unknowns | 完全沒想過（可以做成互動網頁？著作權風險？備案？） | **主動提**風險、選項、替代方案 |

Ⅲ 和 Ⅳ 是重點——多數「AI 做出來不能用」的情況都卡在這兩格。

### 關鍵判別：Ⅲ 用問的，Ⅳ 用端的

擬任何一條內容前，先自問：

> **「使用者現在當場答得出來嗎？」**

- **答得出來** → 象限Ⅲ，用**問的**
- **要先給他資訊才能判斷** → 象限Ⅳ，用**端的**（列出具體選項讓他勾選）

問使用者「你還有什麼沒想到的嗎？」是邏輯錯誤——他答得出來就不叫 Unknown Unknowns 了。

---

## 安裝

直接 clone 成你的 OpenCode skill 目錄：

```bash
git clone https://github.com/mathruffian-dot/rdq-skill-opencode.git ~/.config/opencode/skills/rdq
```

Windows（PowerShell）：

```powershell
git clone https://github.com/mathruffian-dot/rdq-skill-opencode.git $env:USERPROFILE\.config\opencode\skills\rdq
```

裝好後重開 OpenCode 即可。

---

## 使用

講人話就好，不需要記指令：

```
用 RDQ
```

其他會觸發的說法：「先訪談我再做」「幫我釐清需求」「我還沒想清楚要什麼，你先問我」「幫我想想還缺什麼」。

丟一個模糊的大任務時，它會先問一句「要不要先跑 RDQ？」——你說不用，這段對話就不會再問第二次。

### 你會經歷什麼

1. **它先回顯**你說的話 ＋ 它從專案設定檔已經知道的事 → 你只要挑錯，不用回答
2. **問 3–4 題**選項式問題 → 用點的，不用打字；最後一題永遠有「先這樣，直接開始」
3. **端出 3–5 條**你可能沒想到的建議 → 每條標代價，預設不勾，全不勾也能走
4. **給你一張規格卡** → 沒問到的全標成 ❓ 假設，你掃一眼推翻不對的
5. **你說可以，它才動工**

Lite 模式全程**只打擾你 2 次**，Full 模式 3 次。

### 不會觸發的情況

小任務、需求已經很完整、你說「直接做」、純查詢、**以及你在製作 RDQ 相關內容的時候**（做 RDQ 的簡報影片 ≠ 跑 RDQ）。

---

## 換個領域怎麼用

題庫是為**台灣國中教學現場**寫的。但別急著重寫——實際盤過，六段裡只有一段是教學專屬的：

| 領域段 | 換到其他領域 |
|---|---|
| `general` 通用 | ✅ **直接用**。對象／硬限制／執行環境／死線／預算／成功標準／一次性或重複／起點——八個維度換誰都成立 |
| `video` 影片內容 | ✅ **直接用**。任何 YouTuber 都適用，沒一條綁教育 |
| `slides` 教學簡報 | ✅ **幾乎直接用**。「誰上台講」「要交什麼檔」「場地網路能不能賭」「投影設備」是所有簡報的共同問題 |
| `dev` 程式專案 | ✅ **換詞就好**。把「學生／研習」讀成「使用者／活動」，結構完全通用 |
| `workshop` 教育研習 | 🟡 **換詞可用**。學員→參加者、主辦→客戶，企業內訓幾乎照搬 |
| `lesson` 備課教材 | ❌ **真的綁死**。課本版本、段考範圍、課綱編碼，非教師是純負擔，建議直接刪掉換成你自己的 |

### 不補題庫會怎樣？

**能跑，但少了最值錢的部分。**

SKILL.md 的核心規則是領域無關的——象限動詞鎖定、Ⅲ／Ⅳ 判別測試、紅黃綠燈、互動預算、規格卡格式，換誰用都成立。找不到對應領域時，SKILL.md 會指示 Agent 拿通用段當骨架、用這些規則**現場生題**，不會開天窗。

但題庫真正的價值不在題目本身，在於「**不問會怎樣**」那一欄——那是踩過的雷：

> 「學員能不能現場登入 AI 服務？」→ 註冊卡關會吃掉 20–40 分鐘不可逆的現場時間

這種東西模型自己想不出來，因為它沒站在講台上被三十個人盯著等過。**律師、醫護、電商、工程各有各的這種雷，那才是你要補的。**

### 怎麼補

1. 打開 `references/question-bank.md`，照**檔案末尾的範本**加一段
2. Ⅲ 訪談題只收「答案不同會導致重做」的紅燈題，每題附具體選項與「不問會怎樣」
3. Ⅳ 建議菜單從三處找料：你這行的**不可逆決定**、**法遵與資安紅線**、**最常見的失敗原因**；每條標代價
4. 到「領域判定」表加一列

**最快的補法**：不用一次寫完。跑幾次真實任務，把當下真正卡到你的問題記下來，回填。這份題庫本來就是這樣長出來的。

---

## 設計重點

| 機制 | 在解決什麼 |
|---|---|
| **象限動詞鎖定** | Ⅰ只擷取／Ⅱ只解答／Ⅲ只問／Ⅳ只陳述——防止退化成「多問幾句的 chatbot」 |
| **回顯代替提問** | 象限Ⅰ 不佔題數。糾錯比回答便宜一個數量級 |
| **假設顯性化** | 沒問到的全部攤在規格卡上，確認方式從「逐題回答」變成「掃一眼推翻」 |
| **紅黃綠燈** | 答錯會重做的必問、有合理預設的不問、無所謂的自己決定 |
| **零題坍縮** | 就算明說「用 RDQ」，資訊已齊就一題都不問，直接出規格卡 |
| **互動預算硬上限** | 每輪 ≤4 題、Lite 1 輪、Full ≤2 輪，寫死不得發揮 |
| **逃生口常設** | 每輪都能喊停，跳過的問題自動變 ❓ 假設 |
| **status 閘門** | `draft → confirmed`，未確認的規格卡任何 session 都不得執行 |

---

## 檔案結構

```
rdq/
├── SKILL.md                      # 觸發規則、四象限操作規則、七階段流程
└── references/
    ├── question-bank.md          # 六領域題庫（活文件，歡迎依你的領域改寫）
    └── spec-template.md          # 需求規格卡模板
```

`question-bank.md` 內建六個領域：教育研習／教學簡報／備課教材／影片內容／程式專案／通用。
每個領域有「Ⅲ 訪談題」（附具體選項與「不問會怎樣」）和「Ⅳ 建議菜單」（附代價）。

**這是活文件**——題庫決定訪談品質，請依你自己的領域補題、改題。原版是為台灣國中教學現場寫的。

---

## 與 Claude Code 版的差異

| 項目 | Claude Code 版 | OpenCode 版 |
|---|---|---|
| 安裝路徑 | `~/.claude/skills/rdq` | `~/.config/opencode/skills/rdq` |
| 提問工具 | `AskUserQuestion` | `question` |
| 多選參數 | `multiSelect: true` | `multiple: true` |
| 搜尋工具 | `WebSearch` | `webfetch` |
| 專案設定檔 | `CLAUDE.md` | `AGENTS.md` / `CLAUDE.md` |

---

## 原創性與來源聲明

> RDQ Method 並非宣稱創造 Known／Unknown 四象限或需求工程理論。其概念基礎來自已知與未知的知識分類、Unknown Knowns 的後續理論討論，以及需求工程中的 Requirements Elicitation。RDQ Method 的工作是將這些概念進行整合、重新詮釋與流程化，並透過實際實驗，探索其在 AI Agent、AI Skill 與 AI 專案需求建構中的應用。

> The RDQ Method does not claim authorship of the known–unknown knowledge model or requirements engineering. It is an integrative and experimental method that adapts these established concepts into a structured requirement-discovery workflow for AI agents, skills, and projects.

**概念來源**：Known／Unknown 三分類因 Donald Rumsfeld 2002 年的公開談話而廣為人知（更早已見於風險分析、決策與航太領域）；Unknown Knowns 由後續哲學與知識管理討論補入，Slavoj Žižek 的討論尤具影響力；流程面則來自 Requirements Engineering 中的 Requirements Elicitation。

---

## 目前狀態

**實驗性方法**（Experimental）。

適合這樣描述：整合型方法、實務框架、AI 專案前期的需求建構流程。

目前**不宜**稱為：已驗證的學術理論、國際標準、通用 Agent 標準、已證實能提升特定百分比成果的框架。

規格卡內建的 `telemetry` 欄位只是**單臂描述性資料**——沒有對照組，不可用來宣稱「RDQ 降低了 N% 的修改次數」。

認識論上的誠實：AI 無法真正判定使用者「知不知道自己知道」，「當場答得出來與否」只是 Unknown Knowns 的**操作型近似**。

---

## 授權

MIT License — 自由使用、修改、散布。

---

作者：[mathruffian-dot](https://github.com/mathruffian-dot)
