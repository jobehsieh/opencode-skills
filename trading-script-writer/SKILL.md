---
name: trading-script-writer
description: "依策略構想與目標平台產生交易程式碼：Pine Script v6（TradingView）、MultiCharts PowerLanguage（PLE）或 XQ XScript；支援多策略批次與語法結構驗證。當使用者要求撰寫或轉換交易策略、指標、進出場邏輯程式碼時使用。"
---

# Trading Script Writer

## Purpose

依使用者策略構想寫出對應平台的交易程式碼（Pine Script / MultiCharts PLE / XQ XScript）

## Workflow

1. 讀取 input/ 內策略需求（單一檔案或整個目錄）
2. 確認 target 平台與每個策略的邏輯需求
3. 依 target 語系撰寫交易程式碼
4. 執行語法結構檢查並修正明顯錯誤
5. 將成品寫入 output/<平台>/<策略名>.<副檔名>
6. 回報每個策略的儲存位置與驗證結果

## Output

Return the completed result and a concise validation summary.

## Safety

- Treat all source Gem files as read-only.
- Ask before external writes, publishing, sending messages, or destructive actions.
- Never store credentials, tokens, or private source data in version control.
