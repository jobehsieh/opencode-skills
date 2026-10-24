---
name: voice-permission
description: 語音權限通知的設計規範與實作參考。此功能已由 voice-permission plugin 自動處理，本技能僅作為規格文件留存。
---

# Voice Permission Notification

**此功能已由 plugin 自動處理**，不需手動觸發。  
Plugin 位置：`~/.config/opencode/plugins/voice-permission.ts`（**OpenCode V2 格式**）

## 運作方式

- OpenCode V2 的 plugin 以 **目錄** 或 **`.ts`／`.js` 檔**載入；設定在 `opencode.jsonc` 的 `plugins`（複數）陣列
- plugin 必須是 `export default { id, setup(ctx) }`。**V1 寫法 `export default async function({client})` 在 1.18.30 會被拒絕**：
  `PluginModule.LoadError: Plugin must export a default definition with an id and an effect or setup function.`
- V2 `ctx` 的型別宣告不完整，執行期實際提供的模組（2026-10-23 實測）：
  `app, location, options, agent, aisdk, command, event, experimental, generate, model, provider, integration, mcp, permission{hook,list,get,reply}, plugin, reference, rpc, skill, storage, tool, vcs, websearch, worktree, session{hook,create,get,switchAgent,switchModel,prompt,generate,command,synthetic,interrupt,update,move,wait,context}, shell`
- **工作完成**用 `ctx.session.wait({ sessionID })`：收到「明確做事」的事件就先掛一個等待，resolve 就是這一輪結束（對應 HTTP `/api/session/{id}/wait` → 204）。只有位置參數 `wait(sid)` 會失敗（`Expected object`）。
- **權限**用 event `permission.asked`（實測穩定）
- **提問**用 event `question.asked`；此事件在 1.18.30 不保證會送，若沒送，該輪結束時仍會有「工作完成」通知
- 用 edge-tts 產生語音，再用 PowerShell（MediaPlayer）行內播放；不阻塞流程（fire-and-forget）
- V2 會依 location 載入多份 instance（本機實測 11 份），故用檔案原子鎖（工作目錄 `vp-lock-*`）去重，同一件事只播一次

## 🕳️ 2026-10-23 踩坑：通知只響權限那一種

| 症狀 | 原因 | 修法 |
|------|------|------|
| 「工作完成」從不播音 | `session.idle` 事件在 1.18.30 不會送到 plugin | 改用 `ctx.session.wait({sessionID})` |
| 「有問題要回答」從不播音 | `question.asked` 同樣沒送 | 保留事件監聽當加分；靠 wait 至少會提醒 |
| 拿不到 `client`／`serverUrl` 可輪詢 | V1 plugin 介面已被拒絕載入 | 用 V2 `ctx.session`／`ctx.permission` 的執行期能力 |

驗證方式（log 會出現）：

```
plugin loaded (v7: session.wait)
wait:arm sid=ses_xxx
wait:done sid=ses_xxx after=49000ms     ← after 約等於這一輪的長度才正確
python exit: 0 key=idle
```

防誤報：`wait` 若在 1.5 秒內 resolve 視為「當時已閒置」，不播音；同一輪只播一次（`spokeBurst`）。

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
  - 出現 `failed to load plugin` 且訊息是 `Plugin must export a default definition with an id and an effect or setup function` → 用到 V1 寫法
  - 正常會看到 `loading plugin` 且沒有 `failed to load plugin`
- 正常運作時 log 會出現：`plugin loaded (v8: single-logger)`、`wait:arm`、`wait:done … after=…ms`、`python exit: 0 key=idle`
- **只會有一份 instance 寫 log**（`plugin loaded` 每次重載只出現一次）：用 `vp-primary/hb` 心跳鎖選主，主 instance 逾時 12 秒或卸載後由其他份接手。播音與去重仍由所有 instance 共同負責，不影響通知。
- 設定變更（`opencode.jsonc`、`plugins/` 下的檔案）會**自動重載**（存檔後幾秒內），通常不需重啟；判準是 log 出現新的 `plugin loaded`

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

## 🕳️ 2026-10-24 踩坑：每次播音都跳出「系統管理員: Windows PowerShell」視窗

| 症狀 | 原因 | 修法 |
|------|------|------|
| 每次語音通知都彈出一個 PowerShell 視窗，標題是「系統管理員: Windows PowerShell」 | plugin 用 `windowsHide: true` 啟動 python（等於沒有主控台），python 再 spawn `powershell` 時沒帶 `CREATE_NO_WINDOW`；Windows 會替「沒有主控台的子程序」配置新的主控台，而預設終端機是 Windows Terminal，就開一個新視窗 | `spawn(python, …, { windowsHide: true })` ＋ `subprocess.run([...], creationflags=subprocess.CREATE_NO_WINDOW)`，**兩層都要** |

- **只修一層沒用**：只加 `windowsHide` 會讓 python 真的沒有主控台，反而更容易讓孫程序（powershell）拿到新主控台而彈窗。
- 驗證方式：從「沒有主控台」的父程序啟動（例如 `ProcessStartInfo.CreateNoWindow = true`），再用 `EnumWindows` 列舉可見視窗，`CASCADIA_HOSTING_WINDOW_CLASS` 應該是 0 個。
- 播放功能不受影響：修完後實測 edge-tts 產生 4.2 秒音檔、`python exit=0`、無視窗。
