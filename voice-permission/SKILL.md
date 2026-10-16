---
name: voice-permission
description: 語音權限通知的設計規範與實作參考。此功能已由 voice-permission plugin 自動處理，本技能僅作為規格文件留存。
---

# Voice Permission Notification

**此功能已由 plugin 自動處理**，不需手動觸發。  
Plugin 位置：`~/.config/opencode/plugins/voice-permission.ts`（**OpenCode V2 格式**）

## 運作方式

- OpenCode V2 的 plugin 以 **目錄** 或 **`.ts`／`.js` 檔**載入；設定在 `opencode.jsonc` 的 `plugins`（複數）陣列
- plugin 以 `export default { id, setup(ctx) }` 形式註冊（V1 的 `export default async function({client})` 在 V2 **不會執行**）
- 事件用 `ctx.event.subscribe()`；權限詢問用 `ctx.permission.hook("evaluate")`
- 觸發事件：`session.idle`（工作完成）、`question.asked`（Agent 提問）、`permission.asked`（權限詢問）
- 用 edge-tts 產生語音，再用 PowerShell（MediaPlayer）行內播放；不阻塞流程（fire-and-forget）
- V2 會依 location 載入多份 instance，故用檔案原子鎖（工作目錄 `vp-lock-*`）去重，同一事件只播一次

## Edge-TTS 端點（2026-10 遷移）

- 微軟已把 Read Aloud 主機從 `speech.platform.bing.com` 遷到 `api.msedgeservices.com`，舊主機一律回 `403`（edge-tts 7.2.8 仍是最新、尚未跟上）
- plugin 內先試新主機、遇 403 再退回舊主機

## 講稿格式（重要）

**通知一律只講一句短句**，不唸任何細節：

| 情境 | 唸的內容 |
|------|---------|
| 需要權限 | 「需要您的權限，請允許或拒絕。」 |
| 工作完成 | 「工作已完成，請查看畫面上的結果。」 |
| Agent 提問 | 「有問題需要您回答，請回到畫面上回覆。」 |

- **不唸**：工具類型、檔案路徑、命令內容、題目等任何細節——詳細內容寫在 log 與畫面，讓使用者自己看
- 其他通知也一律只講一句短句

## 除錯

- 執行記錄寫入 `~/Documents/Default Project/voice-permission.log`
- 完全沒聲音時，先看 `~/.local/share/opencode/log/opencode.log`：
  - 出現 `configured plugin path must be a directory` 或 `failed to load plugin` → plugin 格式／路徑有問題（多半是舊 V1 寫法或副檔名 `.mjs`）
  - 正常會看到 `loading plugin` 且沒有 `failed to load plugin`
- 正常運作時 log 會出現：`plugin loaded (v2)`、`event:session.idle`、`python exit: 0 key=...`
- 設定變更（`opencode.jsonc`、`plugins/` 下的檔案）會**自動重載**，通常不需重啟

## 新機器安裝（一次性）

- 建立 Python 環境（plugin 使用 `~/Documents/Default Project/.venv`，跨機器自動解析家目錄）：
  ```
  uv venv "$HOME/Documents/Default Project/.venv"
  uv pip install --python "$HOME/Documents/Default Project/.venv/Scripts/python.exe" edge-tts mutagen
  ```
- 需要 dotfiles／chezmoi 同步的檔案：`opencode.jsonc`、`plugins/voice-permission.ts`

## 播放規則

1. **工具**：edge-tts（Python）+ mutagen（偵測時長）
2. **聲音**：`zh-TW-YunJheNeural`
3. **時長**：`Start-Sleep -Seconds (duration + 1)` 避免截斷
4. **不開外部播放器視窗**
