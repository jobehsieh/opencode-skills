<#
  Edge-TTS 行內語音播放（Windows / OpenCode 版）
  用法：powershell -NoProfile -File speak.ps1 -Text "要唸的文字" [-Voice zh-TW-YunJheNeural]
  - 透過同目錄的 edge_tts_run.py 啟動器，把端點指向 api.msedgeservices.com（繞過上游主機遷移的 403）
  - 合成結果快取於 ~/.config/opencode/cache/voice，超過 14 天自動清除
  - 多個語音同時觸發時以 Mutex 排隊，避免重疊
#>
param(
    [Parameter(Mandatory)][string]$Text,
    [string]$Voice = 'zh-TW-YunJheNeural'
)
$ErrorActionPreference = 'Stop'

$cacheDir = Join-Path $HOME '.config\opencode\cache\voice'
New-Item -ItemType Directory -Force $cacheDir | Out-Null
Get-ChildItem $cacheDir -Filter *.mp3 -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

$sha = [System.Security.Cryptography.SHA1]::Create()
$key = -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes("$Voice|$Text")) | ForEach-Object { $_.ToString('x2') })
$mp3 = Join-Path $cacheDir "$key.mp3"

if (-not (Test-Path $mp3) -or (Get-Item $mp3).Length -eq 0) {
    # 找一個裝有 edge_tts 的 Python：優先用 Default Project 的 .venv，其次 PATH 上的 python
    $py = Join-Path $HOME 'Documents\Default Project\.venv\Scripts\python.exe'
    if (-not (Test-Path $py)) { $py = (Get-Command python -ErrorAction SilentlyContinue).Source }
    if (-not $py) { $py = (Get-Command python3 -ErrorAction SilentlyContinue).Source }
    if (-not $py) { throw "找不到 Python，無法產生語音。請安裝 Python 與 edge-tts。" }

    $launcher = Join-Path $PSScriptRoot 'edge_tts_run.py'
    if (-not (Test-Path $launcher)) { throw "找不到啟動器：$launcher" }

    # 文字寫入 UTF-8 檔再以 --file 傳入，避免命令列中文編碼與引號問題
    $txt = Join-Path $cacheDir "$key.txt"
    [IO.File]::WriteAllText($txt, $Text, (New-Object Text.UTF8Encoding($false)))
    try {
        & $py $launcher --voice $Voice --file $txt --write-media $mp3 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "edge-tts 失敗（exit $LASTEXITCODE）" }
    } catch {
        Remove-Item $mp3 -Force -ErrorAction SilentlyContinue
        throw
    } finally {
        Remove-Item $txt -Force -ErrorAction SilentlyContinue
    }
}

Add-Type -AssemblyName PresentationCore
$mutex = New-Object System.Threading.Mutex($false, 'Local\OpenCodeVoiceSpeak')
$locked = $false
try {
    $locked = $mutex.WaitOne(30000)
    $player = New-Object System.Windows.Media.MediaPlayer
    $player.Open([Uri]$mp3)
    $player.Play()
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while (-not $player.NaturalDuration.HasTimeSpan -and $sw.Elapsed.TotalSeconds -lt 3) { Start-Sleep -Milliseconds 100 }
    # 讀不到長度時以檔案大小估算（Edge-TTS 約 48kbps ≒ 6000 bytes/秒）
    $sec = if ($player.NaturalDuration.HasTimeSpan) { $player.NaturalDuration.TimeSpan.TotalSeconds }
           else { (Get-Item $mp3).Length / 6000 }
    Start-Sleep -Milliseconds ([int](($sec + 0.7) * 1000))
    $player.Close()
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
}
