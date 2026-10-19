#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Taiwanese Hokkien (Taigi / 臺灣閩南語) speech-to-text.

Core model: MediaTek Breeze-ASR-26 (Whisper-large-v2 fine-tuned on ~10k hours of
Taigi speech, Apache-2.0). Runs through faster-whisper / CTranslate2 so it works
on CPU or GPU without PyTorch.

Output is Mandarin Chinese character transcription (per the model's design), not
Taigi orthography (Tâi-lô / 台語正字).

Examples:
  python asr.py audio.m4a
  python asr.py interview.mp3 --format srt --output interview.srt
  python asr.py talk.wav --device cpu --compute-type int8 --beam-size 5
  python asr.py --download-only
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

DEFAULT_MODEL = os.environ.get(
    "TAIGI_ASR_MODEL", "paulpengtw/faster-whisper-Breeze-ASR-26"
)

AUDIO_EXT = {
    ".wav", ".mp3", ".m4a", ".flac", ".ogg", ".opus", ".webm",
    ".mp4", ".mkv", ".aac", ".wma", ".mov",
}


def _force_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
        except Exception:
            pass


def resolve_device(requested: str) -> str:
    if requested != "auto":
        return requested
    try:
        import ctranslate2

        if ctranslate2.get_cuda_device_count() > 0:
            return "cuda"
    except Exception:
        pass
    return "cpu"


def compute_type_candidates(device: str, requested: str | None) -> list[str]:
    if requested:
        return [requested]
    if device == "cuda":
        return ["float16", "int8_float16", "int8", "float32"]
    return ["int8", "float32"]


def load_model(model_name: str, device: str, requested_compute: str | None):
    from faster_whisper import WhisperModel

    errors: list[str] = []
    for compute in compute_type_candidates(device, requested_compute):
        try:
            model = WhisperModel(model_name, device=device, compute_type=compute)
            return model, compute
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{compute}: {exc}")
    raise SystemExit(
        "Could not load model '%s' on %s.\n%s" % (model_name, device, "\n".join(errors))
    )


def fmt_ts(seconds: float, sep: str = ",") -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def render(segments, fmt: str) -> str:
    if fmt == "srt":
        out = []
        for i, seg in enumerate(segments, 1):
            out.append(
                f"{i}\n{fmt_ts(seg.start)} --> {fmt_ts(seg.end)}\n{seg.text.strip()}\n"
            )
        return "\n".join(out)
    if fmt == "vtt":
        out = ["WEBVTT", ""]
        for seg in segments:
            out.append(f"{fmt_ts(seg.start, '.')} --> {fmt_ts(seg.end, '.')}")
            out.append(seg.text.strip())
            out.append("")
        return "\n".join(out)
    if fmt == "json":
        return json.dumps(
            [
                {"start": s.start, "end": s.end, "text": s.text.strip()}
                for s in segments
            ],
            ensure_ascii=False,
            indent=2,
        )
    # txt
    return "".join(s.text for s in segments).strip() + "\n"


def main() -> int:
    _force_utf8()
    parser = argparse.ArgumentParser(
        description="Taiwanese Hokkien speech-to-text (MediaTek Breeze-ASR-26 via faster-whisper)."
    )
    parser.add_argument("audio", nargs="?", help="audio/video file to transcribe")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="HF model id or local CT2 dir")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    parser.add_argument(
        "--compute-type",
        default=None,
        help="CTranslate2 compute type (default: int8 on CPU, float16 on CUDA)",
    )
    parser.add_argument(
        "--format", default="txt", choices=["txt", "srt", "vtt", "json"]
    )
    parser.add_argument("--output", default=None, help="output path (default: <audio>.taigi.<fmt>)")
    parser.add_argument("--task", default="transcribe", choices=["transcribe", "translate"])
    parser.add_argument("--beam-size", type=int, default=5)
    parser.add_argument("--language", default="zh", help="source language hint (default zh)")
    parser.add_argument("--no-vad", dest="vad", action="store_false", help="disable VAD filtering")
    parser.add_argument("--initial-prompt", default=None, help="optional decoding prompt (proper nouns etc.)")
    parser.add_argument("--download-only", action="store_true", help="only fetch the model, then exit")
    parser.set_defaults(vad=True)
    args = parser.parse_args()

    device = resolve_device(args.device)

    print(f"[taigi-asr] model   : {args.model}")
    print(f"[taigi-asr] device  : {device}")

    t0 = time.time()
    model, compute = load_model(args.model, device, args.compute_type)
    print(f"[taigi-asr] compute : {compute}")
    print(f"[taigi-asr] loaded in {time.time() - t0:.1f}s")

    if args.download_only:
        print("[taigi-asr] model ready (download-only).")
        return 0

    if not args.audio:
        parser.error("audio path is required (or use --download-only)")

    audio = Path(args.audio)
    if not audio.exists():
        print(f"[taigi-asr] ERROR: file not found: {audio}", file=sys.stderr)
        return 2
    if audio.suffix.lower() not in AUDIO_EXT:
        print(f"[taigi-asr] WARNING: unusual extension '{audio.suffix}'", file=sys.stderr)

    t1 = time.time()
    segment_iter, info = model.transcribe(
        str(audio),
        language=args.language,
        task=args.task,
        beam_size=args.beam_size,
        vad_filter=args.vad,
        condition_on_previous_text=False,
        initial_prompt=args.initial_prompt,
    )

    if args.format in ("srt", "vtt", "json"):
        segments = list(segment_iter)
    else:
        def _relay():
            for seg in segment_iter:
                print(seg.text.strip(), flush=True)
                yield seg

        segments = list(_relay())

    text = render(segments, args.format)
    elapsed = time.time() - t1
    dur = getattr(info, "duration", 0) or 0
    xrt = (dur / elapsed) if elapsed > 0 and dur else 0

    out_path = Path(args.output) if args.output else audio.with_suffix(
        f".taigi.{args.format}"
    )
    out_path.write_text(text, encoding="utf-8")

    print("")
    print(f"[taigi-asr] audio duration : {dur:.1f}s")
    print(f"[taigi-asr] transcribe time: {elapsed:.1f}s ({xrt:.2f}x realtime)")
    print(f"[taigi-asr] detected lang  : {getattr(info, 'language', '?')}")
    print(f"[taigi-asr] output         : {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
