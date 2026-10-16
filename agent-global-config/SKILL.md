---
name: agent-global-config
description: 三師爸的全域工作規範（OpenCode 版）：(1) 使用者說「用語音回答／唸出來／唸給我聽／用語音講結論」時以 Edge-TTS 行內語音回覆；(2) 說明工作結束或需使用者介入時的自動語音通知機制；(3) 使用者說「開工／我來了／上次做到哪」或「收工／下班／結束」時執行同步流程。
---

# AI Agent 全域設定規範（OpenCode 版）

## 一、語音回覆（Edge-TTS）

唯一語音工具是 **Edge-TTS**（微軟雲端合成、免費）。不用 SAPI 離線語音、不開外部播放器視窗。

**觸發**：使用者說「用語音回答」「唸出來」「唸給我聽」「用語音講結論」。

**講稿**
- 口語化、精簡，約 100–250 字。
- 數字用中文（「五十頁」而非「50頁」）。
- 只講結論與下一步，細節留在文字回覆。

**播放**：一律行內播放，使用本 skill 的腳本（已處理快取、中文編碼與播放排隊）：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$HOME\.config\opencode\skills\agent-global-config\scripts\speak.ps1" -Text "講稿內容"
```

- 預設聲音 `zh-TW-YunJheNeural`（男）。使用者指定才換，加 `-Voice`：`zh-TW-HsiaoChenNeural`（女，活潑）、`zh-TW-HsiaoYuNeural`（女，柔和）。完整清單：`edge-tts --list-voices`。
- 使用者指名「用三師爸的聲音」屬聲音複製，需另用 voice-clone 技能（VoxCPM2），不在本 skill 範圍。
- 播放完只回報「語音已播放」，不重複文字內容。
- 需要一個裝有 `edge_tts` 的 Python：`speak.ps1` 會優先用 `~/Documents/Default Project/.venv` 的 Python，其次 PATH 上的 `python`（或 `python3`）；皆找不到才報錯。安裝方式：`uv tool install edge-tts` 或 `pip install edge-tts`。

> **🕳️ 2026-10-12 踩坑（已修）**：微軟把 Edge 朗讀的 TTS 端點從 `wss://speech.platform.bing.com/...` 遷移到 `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1`，導致 `edge-tts` 7.2.8 **全面 403**（全球性、分區陸續生效，非本機或網路問題；連美西也在 2026-10-12 02:50 UTC 起淪陷）。
> 本 skill 已內建 `scripts/edge_tts_run.py` 啟動器：只把 WebSocket 端點指到新主機（其餘沿用舊 `TrustedClientToken` 與 `Sec-MS-GEC-Version=1-143.0.3650.75`），社群實測可正常合成；`speak.ps1` 會自動透過它合成。啟動器不修改 `site-packages`，可存活於 `edge-tts` 升級。
> 日後上游修好或微軟再改：同步更新此啟動器即可。詳見 <https://github.com/rany2/edge-tts/issues/490>

## 二、語音通知（自動，由 Plugin 觸發）

工作結束或需要使用者介入時，會自動語音通知，讓使用者即時處理。這是 OpenCode plugin 訂閱事件執行的，**不需要 Agent 自己呼叫**：

| 時機 | 事件 / 掛鉤 | 語音內容 |
|---|---|---|
| 一輪工作結束 | event `session.idle` | 「工作已完成，請查看畫面上的結果。」 |
| 需要授權 | event `permission.asked`（hook `permission.ask` 保留備用） | 「需要您的權限：<類型> …請允許或拒絕。」 |
| Agent 向使用者提問 | event `question.asked` | 「有問題需要您回答，請回到畫面上回覆。」 |

- Plugin 位置：`~/.config/opencode/plugins/voice-permission.mjs`（由 `opencode.jsonc` 的 `plugin` 載入）。
- 它使用 `~/Documents/Default Project/.venv` 的 Python（edge-tts + mutagen）行內播放，fire-and-forget、不阻塞。
- 執行記錄：`~/Documents/Default Project/voice-permission.log`；若無語音先查此 log 是否有對應事件與 `python exit: 0`。
- 改完 plugin 需**重啟 OpenCode** 才會載入。

**Agent 的責任**：需要使用者決定時，直接提問並停下等待（會觸發上面的通知），不要猜測後繼續。若通知沒響，先檢查 `edge-tts` 與網路（Edge-TTS 需連線），不要改用其他語音工具。

## 三、開工／收工同步

OpenCode 已把開工／收工做成獨立技能，直接觸發即可：

- **開工**（「開工」「我來了」「上次做到哪」）→ 使用 `startup` 技能：讀 `AGENTS.md` 與 `handoff.md`、檢查 git（含遠端 fetch）、辨識是否在別台電腦收工、建議下一步。
- **收工**（「收工」「下班」「結束」）→ 使用 `shutdown` 技能：更新 `AGENTS.md` 進度與 `handoff.md`、git commit + push、把詳細紀錄寫進 Obsidian、回報 checklist。

## 四、換電腦 Checklist

- [ ] `chezmoi update`（同步 OpenCode／Claude Code 設定）
- [ ] 確認 OpenCode 設定來源 `dot_config/opencode` 已含 `skills/agent-global-config`
- [ ] 安裝 Edge-TTS：`uv tool install edge-tts`（或 pip）
- [ ] 確認 plugin `voice-permission.mjs` 所需環境：`uv venv "$HOME/Documents/Default Project/.venv"` 並 `uv pip install --python ... edge-tts mutagen`
- [ ] 檢查 API key 檔案是否存在
- [ ] 手動同步其他 Agent（Codex、Gemini／Antigravity）的設定

## 五、語音輸入錯字

語音輸入的錯字處理規則見全域指令 `~/.config/opencode/instructions/voice-input-normalization.md`，此處不重複。
