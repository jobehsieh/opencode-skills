---
name: claude-video-specs
description: 三類影片製作規範與自動 bootstrap 流程（活動紀錄 01／教學 02／社群科普 03）。當使用者說「做一支影片」「做教學影片」「做活動紀錄影片」「做社群科普影片」「啟動 claude-video-specs」「按照影片規範做」或要製作 60s–8min 的影片時使用。先讀 AGENTS.md 依 5 階段流程執行，每階段都要詢問使用者確認。
---

# claude-video-specs

三類影片製作規範 + 可 fork 的範例專案。給 AI agent 和創作者用。

## 使用方式

1. 先讀 `AGENTS.md`（本技能根目錄），依「5 階段 bootstrap 流程」執行
2. 每階段都要**主動詢問使用者**再進下一步，不要連跑五階段
3. 開工前先讀 `GOTCHAS.md` 的踩坑筆記
4. 規範在 `specs/01-活動紀錄影片.md`、`specs/02-教學影片.md`、`specs/03-社群科普影片.md`
5. 範本在 `examples/01-marathon-light/`、`examples/02-factors-multiples/`、`examples/03-ai-context/`

## 三類影片速覽

| # | 類型 | 片長 | 核心元素 |
|---|------|------|---------|
| 01 | 活動紀錄影片 | 60–180s | 口白 + 大字卡 + BGM 過場 |
| 02 | 教學影片 | 4–8 min | SOIL 教學脈絡 + 動畫 + Edge-TTS |
| 03 | 社群科普影片 | 2–3 min | 強 Hook + 多版面 + 照片佐證 |

## 工具需求

- Python 3.8+ / pip / edge-tts（TTS 旁白）
- Node.js 18+ / ffmpeg / Playwright（渲染）
- 源石黑體（視覺一致，跑 `install/install_fonts.sh`）
- 環境檢查流程見 `AGENTS.md` 階段 1，安裝工具在 `install/` 內

## 注意

- 不含任何 binary 素材（mp4、mp3、png、字體），全部透過 bootstrap 動態取得
- Windows 用 PowerShell 時用 `install/setup.py`（跨平台）替代 `.sh`
- 完成影片後可問使用者是否要打包成可重複呼叫的技能（`install/pack_skill.sh`）
