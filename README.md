<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Bank Balance Tracker PWA

這是一個使用 Next.js 建置的銀行餘額追蹤 PWA (Progressive Web App)，可安裝於桌面或手機主畫面，並具備簡潔、可愛且專業質感的風格。

## 專案功能
*   **PWA 支援**：可安裝於桌面或手機主畫面。
*   **銀行餘額追蹤**：輕鬆記錄每月餘額。
*   **Google Cloud 整合**：整合 Firebase Auth 與 Cloud Run 部署。

## 前置需求

在開始部署前，請確認您已安裝並設定以下工具：
1.  [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (gcloud CLI)
2.  已登入 Google Cloud 帳號：`gcloud auth login`
3.  已設定專案 ID：`gcloud config set project [YOUR_PROJECT_ID]`

## 本地開發

```bash
# 安裝套件
npm install

# 啟動開發伺服器
npm run dev
```

打開 http://localhost:3000 即可預覽。

## CI/CD 部署流程 (Deploy to Cloud Run)

本專案使用 Google Cloud Build 與 Cloud Run 進行部署。

### 1. 構建並推送 Docker Image
此步驟會將程式碼打包並上傳至 Google Container Registry (GCR)。

```bash
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/bank-balance-tracker-pwa
```

### 2. 部署服務到 Cloud Run
將 Image 部署到 Cloud Run，並開放公開存取。請將 `[YOUR_REGION]` 替換為您想要的區域 (例如 `asia-east1`)。

```bash
gcloud run deploy bank-balance-tracker-pwa \
  --image gcr.io/[YOUR_PROJECT_ID]/bank-balance-tracker-pwa \
  --platform managed \
  --region [YOUR_REGION] \
  --allow-unauthenticated
```

## 注意事項
*   **環境變數**：部署時會自動讀取 `.env.production` (透過 `.gcloudignore` 白名單機制)。
*   **權限**：Cloud Run 服務帳號需具備 `Firebase Authentication Admin` 權限才能正常運作。
*   **Firebase Authentication 網域設定**：部署完成後，務必至 Firebase Console 的 `Authentication` > `Settings` > `Authorized domains`，將 Cloud Run 產生的網址加入允許清單，否則登入功能會失敗。
