---
name: taigi-asr
description: 臺灣閩南語（台語／臺灣話）語音轉文字。用 MediaTek Breeze-ASR-26（Whisper-large-v2 微調、Apache-2.0）把台語或「國台語夾雜」的錄音、影片轉成繁體中文逐字稿，可輸出 txt／srt／vtt／json。當使用者要「台語語音辨識」「台語逐字稿」「台語錄音轉文字」「臺灣閩南語轉文字」「台語字幕」「幫台語影片上字幕」「把這段台語翻成文字」或直接丟台語音檔／影音檔要轉文字時載入。
---

# Taigi ASR — 臺灣閩南語語音辨識

把台語（臺灣閩南語）語音轉成**繁體中文字**逐字稿。核心模型是聯發創新基地（MediaTek Research）的
**Breeze-ASR-26**（以 Whisper-large-v2 微調、約 1 萬小時台語語音、Apache-2.0），
透過 `faster-whisper`（CTranslate2）執行，所以**不需要 PyTorch**，CPU 或 GPU 都能跑。

> 注意：本模型輸出的是**華語漢字**（方便閱讀），不是台語正字（Tâi-lô／白話字）。

## 已安裝狀態（本機）

- 技能目錄：`C:\Users\user\.config\opencode\skills\taigi-asr\`
- 獨立環境：`.venv`（uv 建置的 CPython 3.12；本機系統 Python 是 3.14，套件輪子不齊，故隔離）
- 模型：`paulpengtw/faster-whisper-Breeze-ASR-26`（HF 快取於 `C:\Users\user\.cache\huggingface\hub`，約 2.9 GB）
- 本機**無 NVIDIA GPU → 以 CPU int8 執行**（速度約 0.8x 即時；長音檔會較好）

## 使用方式

用技能專屬的 Python 執行 `asr.py`（**不要**用系統 Python）：

```powershell
$py = "C:\Users\user\.config\opencode\skills\taigi-asr\.venv\Scripts\python.exe"
$s  = "C:\Users\user\.config\opencode\skills\taigi-asr\asr.py"

# 基本：輸出 <原檔名>.taigi.txt（與音檔同目錄）
& $py $s "音檔路徑.m4a"

# 指定輸出格式與檔名
& $py $s "訪談.mp3" --format srt --output "訪談.台語.srt"

# 指定下 prompt（人名、地名等專有名詞可提高辨識率）
& $py $s "阿公.m4a" --initial-prompt "阿公、台南、三合院"
```

### 參數

| 參數 | 說明 | 預設 |
|------|------|------|
| `audio` | 要轉的音／影音檔（位置參數） | — |
| `--model` | HF 模型 id 或本機 CT2 目錄 | `paulpengtw/faster-whisper-Breeze-ASR-26`（可用環境變數 `TAIGI_ASR_MODEL` 覆寫） |
| `--device` | `auto` / `cpu` / `cuda` | `auto`（有 CUDA 用 GPU） |
| `--compute-type` | CTranslate2 精度 | CPU→`int8`、CUDA→`float16` |
| `--format` | `txt` / `srt` / `vtt` / `json` | `txt` |
| `--output` | 輸出檔路徑 | `<音檔>.taigi.<格式>` |
| `--beam-size` | 解碼 beam | `5` |
| `--language` | 來源語言提示 | `zh`（模型建議值，輸出華語漢字） |
| `--no-vad` | 關閉靜音過濾（VAD） | 預設開啟 VAD |
| `--initial-prompt` | 解碼提示詞（專有名詞） | 無 |
| `--download-only` | 只下載／載入模型後結束 | — |

## 支援格式

WAV、MP3、M4A、FLAC、OGG、OPUS、WEBM、MP4、MKV、AAC、WMA、MOV
（由 PyAV 內建的 FFmpeg 解碼，**不需另裝 ffmpeg**）。

## 流程（給 Agent 的 SOP）

1. **確認檔案存在**：`Test-Path -LiteralPath "<音檔>"`
2. **執行**：用上面的 venv Python 呼叫 `asr.py`。
3. **讀取輸出**：用 Read 工具讀 `<音檔>.taigi.txt`（UTF-8，不會亂碼）。
   - 命令列 stdout 在 PowerShell 可能顯示亂碼（cp950），**以輸出檔為準**。
4. **回報**：把逐字稿內容與輸出檔路徑給使用者。

> 長音檔（>10 分鐘）：CPU 會慢，建議先切段或改用 GPU 機器；輸出仍可用 `srt` 取得時間軸。

## 疑難排解

- **`open() got an unexpected keyword argument 'metadata_errors'`**
  → `av` 版本太新（17+ 移除此參數）。本技能已釘 `av==15.1.0`；
  若重建環境請務必依 `requirements.txt` 安裝，勿讓 `av` 被解析到最新版。
- **模型載入很久（首次）**：第一次會下載約 2.9 GB，之後走本機快取。
- **HF 下載警告**（unauthenticated / symlink）：可忽略；速度慢時可設 `HF_TOKEN`。
- **速度太慢**：確認是否為 CPU。有 CUDA 時 `--device cuda` 會快很多。
- **輸出為華語漢字**：這是模型設計，不是錯誤。

## 重建環境（換電腦或環境損毀時）

```powershell
$dir = "C:\Users\user\.config\opencode\skills\taigi-asr"
uv venv --python 3.12 "$dir\.venv"
uv pip install --python "$dir\.venv\Scripts\python.exe" -r "$dir\requirements.txt"
& "$dir\.venv\Scripts\python.exe" "$dir\asr.py" --download-only
```

## 完成回報格式

```md
- 輸入：<音檔路徑>
- 模型：MediaTek Breeze-ASR-26（device/compute）
- 長度：<秒>；轉錄耗時：<秒>（<xRT>x 即時）
- 格式：txt / srt / vtt / json
- 輸出：<輸出檔路徑>
- 逐字稿摘要：<前 1-3 句>
```
