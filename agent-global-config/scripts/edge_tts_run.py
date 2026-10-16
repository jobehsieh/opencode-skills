"""Edge-TTS 啟動器（繞過上游主機遷移造成的 403）。

背景：
    2026-10-12 起 Microsoft 把 Edge「朗讀」的 TTS 端點從
        wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
    遷移到
        wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1
    舊主機的 WebSocket 握手會被新後端節點以 403 拒絕。
    社群實測：只要換到新主機、其餘沿用舊的 TrustedClientToken 與
    Sec-MS-GEC-Version（1-143.0.3650.75）即可正常合成。
    參考：https://github.com/rany2/edge-tts/issues/490

用法（與 edge-tts CLI 完全相同）：
    python edge_tts_run.py --voice zh-TW-YunJheNeural --file text.txt --write-media out.mp3

此啟動器只覆寫 WSS_URL，不動 site-packages，因此 edge-tts 升級後仍有效。
日後若上游修好、或微軟改回舊主機，只要移除本檔並改回直接用 edge-tts CLI 即可。
"""

import sys

from edge_tts import communicate
from edge_tts.constants import TRUSTED_CLIENT_TOKEN
from edge_tts.util import main

# 新主機 + 沿用舊版權杖（目前可用；改用 v2 版本號反而會 403）
communicate.WSS_URL = (
    "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1"
    f"?Ocp-Apim-Subscription-Key={TRUSTED_CLIENT_TOKEN}"
)

if __name__ == "__main__":
    main()
