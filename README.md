# 楊梅高中圖書館 3D 互動探索島 V2.0

依據 **1F／2F 空間配置圖** 重建的雙層 3D 圖書館，並整合〈圖書館新生利用教育〉PDF 教材，讓新生以探索遊戲認識圖書館。

> ⚠ 本模型保留配置圖的相對位置、比例、出入口、樓梯、書架排列與走道關係；尺寸為**示意比例**（1 px ≈ 0.02 m，樓高 4.2 m），不等同真實建築尺寸。可在 `src/data/config.js` 調整。

---

## 1. 快速開始

需要 Node.js 18 以上。

```bash
npm install
```

```bash
npm run dev
```

開啟 <http://localhost:5173> 即可操作。其他指令：

| 指令 | 說明 |
| --- | --- |
| `npm run build` | 產生 `dist/` 靜態網站 |
| `npm run preview` | 預覽 build 結果 |
| `npm run check:layout` | 以 Node 檢查配置資料（方位規則、ID、FAQ、題庫） |

## 2. 原始材料

| 檔案 | 用途 |
| --- | --- |
| `materials/圖書館空間配置圖1F.PNG` | 一樓建模依據（2000×1125 px），複製於 `public/plans/floor1.png` |
| `materials/圖書館空間配置圖2F.PNG` | 二樓建模依據，複製於 `public/plans/floor2.png` |
| `materials/新生利用教育說明資料.pdf` | 規定、借閱、FAQ、數位服務內容，複製於 `public/docs/library-guide.pdf` |

所有區域範圍是以色塊自動偵測平面圖後取得的**像素座標**，再人工命名；未自行旋轉或鏡像圖面。

## 3. 座標系統

- 平面圖左上為 `(0,0)`、右下為 `(1,1)`（標準化座標 `mapBounds`）。
- 圖片上方＝場景北側（世界 −Z），右方＝東側（世界 +X）。僅供定位，不代表真實地理方位。
- 轉換函式集中於 `src/core/coords.js`：`pxRect`、`normToWorld`、`worldToNorm`、`boundsToWorld`、`worldBoxToBounds`、`floorBaseY`。
- 2D 熱區、3D 模型、資訊卡小地圖、驗證模式**全部使用同一份 `mapBounds`**。

## 4. 專案結構

```
src/
  main.js                 進入點，串接所有模組
  style.css               版面、RWD、列印樣式
  core/                   coords（座標）、store（localStorage）、events、i18n、audio（音效/語音）
  data/
    config.js             尺寸參數（示意比例）
    floor1-layout.js      一樓 30 個場域（px 範圍、說明、互動類型）
    floor2-layout.js      二樓 23 個場域（含 10 排書架、樓梯井開口）
    zones.js              統一整理：id/name/floor/category/position/size/rotation/description/interactionType/quizIds/mapBounds
    layout-rules.js       方位驗證規則（驗證模式與 check 腳本共用）
    library-content.js    PDF 規定、開館時間、借閱規則、價目、使用規範情境
    faq-data.js           FAQ Q01～Q11 原文
    quiz-data.js          測驗題庫（16 題，每次抽 10 題，70 分過關）
    tour-paths.js         借書導覽路線、樓梯幾何、自動導覽腳本
    books-data.js         示範書目（明確標示非真實館藏）
  scene/
    SceneManager.js       渲染器、鏡頭、OrbitControls、7 種模式、點選、高亮、導覽線、日夜、效能
    building.js           樓板（含樓梯井開口）、外牆與窗、屋頂、場域物件、點選區、標籤
    furniture.js          依 kind 產生家具（書架、桌椅、櫃台、樓梯、事務機器…）
    island.js             漂浮島、步道、樹木、花圃、看板、指示牌、微型學生、雲、星空
    kit.js                共用建模工具
  ui/                     側欄、資訊卡、2D/3D 對照、驗證模式、設定、自動導覽、任務 HUD
  learning/               學習中心 6 單元、模擬借書、探險任務、學習歷程
materials/                原始配置圖與 PDF 教材（建模依據，不參與建置）
scripts/check-layout.mjs  配置資料檢查
.github/workflows/deploy.yml  GitHub Pages 自動部署
```

### 新增或修正一個空間

1. 在 `floor1-layout.js` / `floor2-layout.js` 新增一筆資料，`px` 填入平面圖像素範圍 `[左, 上, 右, 下]`。
2. `kind` 選擇既有的建模類型（`tables`、`bookshelf`、`room`、`screen`…）或在 `furniture.js` 新增 builder。
3. 執行 `npm run check:layout` 與開啟「配置驗證」模式確認。

## 5. 操作手冊

### 觀看模式（上方分頁，鍵盤 1～7）

| 模式 | 說明 |
| --- | --- |
| 完整建築 | 含屋頂與完整外牆；點擊建築會進入室內探索 |
| 樓層展開 | 2F 向上分離，淡藍虛線連結兩層；可拖曳「分離距離」 |
| 一樓俯視 | 隱藏 2F，從上方觀察一樓 |
| 二樓俯視 | 聚焦 10 排書架與閱讀區 |
| 室內探索 | 點擊空間，鏡頭飛到該區上方的安全視角（剖面牆、不穿牆、不進入家具） |
| 2D／3D 對照 | 左側原始平面圖、右側 3D；任一側點擊都會同步高亮 |
| 配置驗證 | 平面圖半透明疊合、範圍框、方位規則、人工座標校正 |

### 工具列

返回全景、鳥瞰、自動旋轉、日夜、標籤顯示、自動導覽、語音解說、動畫速度（0.5×～2×）、手機省電、全螢幕。

### 滑鼠與觸控

- 拖曳旋轉、滾輪縮放、右鍵拖曳平移。
- 手機：單指旋轉、雙指縮放／平移；空間目錄在右上角 ☰，資訊卡為底部抽屜。
- 快捷鍵：`H` 返回全景、`/` 搜尋空間。

### 學習中心（6 單元＋測驗）

1. **認識空間**：找出大門、櫃台、書庫、資訊檢索區、梅高特藏區等 10 處，答錯 2 次會提示。
2. **模擬借書**：3D 地面箭頭＋小人物：大門 → 樓梯 → 二樓書庫 → 選書（最多 4 本、漫畫不可外借）→ 返回一樓 → 櫃台 → 出示學生證 → 顯示到期日與續借資訊；另有逾期停權試算。
3. **圖書查詢**：關鍵字／書名／ISBN 模擬查詢，可在 3D 中顯示書架位置（示範資料）。
4. **數位服務**：影印／列印／掃描費用試算，檢查悠遊卡餘額需 10 元以上。
5. **使用規範**：10 則情境判斷（飲料、漫畫、上課留館、海報…），答案依 PDF。
6. **FAQ**：Q01～Q11 原文，分類、搜尋、展開、朗讀、跳到相關位置。

### 探險任務

6 個關卡（大門、資訊檢索區、一樓到二樓書庫、借書模擬、梅高特藏區、測驗），每關有說明、目標區域、即時回饋、成功動畫與積分，全部完成獲得「楊梅高中圖書館探索達人」徽章。

### 學習歷程

記錄暱稱、探索區域、關卡、測驗分數、錯題、探索時間、最近學習時間；支援 JSON／CSV 匯出、列印、重新開始、清除。資料只存在瀏覽器 localStorage。

### 七大設定（⚙️）

全螢幕、音效、裝置模式（自動／電腦／觸控）、版面（標準／專注／簡潔）、語言（繁中／English 預留）、字體（標準／大／特大）、動畫效能（高／標準／省電）。全部立即生效並存於 localStorage。

## 6. 部署到 GitHub Pages

`vite.config.js` 使用 `base: './'`，可部署在任何子路徑（例如 `https://<帳號>.github.io/<repository>/`）。

### 方法 A：GitHub Actions 自動部署（建議）

1. 在 GitHub 建立新的 repository（例如 `ymsh-library-3d`），**不要**勾選新增 README。
2. 在本專案資料夾執行（將網址換成你的 repository）：

   ```bash
   git add -A
   ```

   ```bash
   git commit -m "楊梅高中圖書館 3D 互動探索島 V2.0"
   ```

   ```bash
   git remote add origin https://github.com/<帳號>/ymsh-library-3d.git
   ```

   ```bash
   git push -u origin main
   ```

   或把 `release/ymsh-library-3d-source.zip` 解壓縮後，用 GitHub 網頁的 **Add file → Upload files** 上傳全部檔案。網頁上傳有時會略過以 `.` 開頭的資料夾；若上傳後看不到 `.github`，請用 **Add file → Create new file**，檔名輸入 `.github/workflows/deploy.yml`，貼上本專案同名檔案內容。
3. 到 repository 的 **Settings → Pages**，**Source** 選擇 **GitHub Actions**。
4. 到 **Actions** 分頁確認「Deploy to GitHub Pages」執行成功（約 1 分鐘）；之後每次推送 `main` 都會自動執行配置檢查、建置並部署。
5. 網址為 `https://<帳號>.github.io/<repository>/`。

### 方法 B：直接上傳建置好的網站

不想使用 Actions 時，可用 `release/ymsh-library-github-pages.zip`（即 `npm run build` 的 `dist/` 內容）：

1. 建立 repository，將 zip 解壓縮後的檔案（`index.html`、`assets/`、`plans/`、`docs/`、`.nojekyll`）上傳到根目錄。
2. **Settings → Pages**，Source 選 **Deploy from a branch**，分支 `main`、資料夾 `/ (root)`。

此方式不會自動重新建置，修改原始碼後需重新 `npm run build` 再上傳。`dist/` 也可放到任何靜態網站空間。

## 7. 已測試功能

以下於本機 Vite 開發伺服器，透過瀏覽器自動化實際操作驗證（Chromium，1440×900 與 375×812 手機模擬）：

- 開啟即顯示雙層 3D 圖書館，無 JavaScript 錯誤。
- 7 種觀看模式切換、樓層展開、1F／2F 切換、鏡頭飛行。
- 真實滑鼠點擊 3D 區域選取（梅高特藏區）、拖曳旋轉、滾輪縮放。
- 2D／3D 對照：點平面圖「借還書櫃台」→ 3D 同步高亮並聚焦，資訊卡同步。
- 配置驗證：1F 10/10、2F 8/8 方位規則通過；模型與配置圖差異 1F 28/28、2F 22/22 吻合。
- `npm run check:layout`：全部通過。
- 模擬借書全流程 7 步完成；第 5 本與漫畫被正確阻擋；到期日計算；探險任務第 4 關自動完成。
- 測驗計分（8/10 → 80 分、錯題 2 題記錄、第 6 關過關）。
- 探險任務 6 關全數完成並取得徽章。
- FAQ 11 題完整、搜尋；影印費用、餘額不足、掃描免費計算；ISBN 查詢；規範情境判斷。
- 七大設定（字體、版面、裝置、效能、語言、音效）立即生效並寫入 localStorage。
- 工具列：日夜、標籤、自動旋轉、速度、省電、鳥瞰、返回全景、自動導覽開關。
- 學習歷程暱稱儲存、JSON／CSV 匯出內容。
- 以子路徑（模擬 GitHub Pages `/<repo>/`）提供 `dist/`，資源與平面圖正確載入。
- 手機版版面（底部抽屜資訊卡、側欄抽屜、可捲動工具列）。

### 尚未驗證

- 實際部署到 GitHub Pages（workflow 已提供，尚未在 GitHub 上執行；已以本機靜態伺服器模擬 `/<repo>/` 子路徑驗證）。
- 實體手機的觸控手勢（僅以瀏覽器手機模擬驗證版面）。
- 語音朗讀的實際發音（依瀏覽器是否提供 zh-TW 語音而定）、全螢幕實際切換、列印輸出版面。
- Safari／Firefox 相容性。

## 8. 已知限制與後續擴充建議

- **尺寸為示意比例**：平面圖未提供實際長寬與樓高，建議依現場量測更新 `config.js` 的 `WORLD` 參數。
- **樓梯為示意折返梯**：1F 樓梯區與 2F 樓梯井的實際梯段走向未在圖面標示，目前以第一段向東、第二段向西的折返梯連接，參數在 `tour-paths.js` 的 `STAIR_GEOMETRY`。
- **二樓中央「閱讀區」**以閱讀桌椅示意（未解讀為書架），可依現場照片修正 `f2-reading-center`。
- **二樓西側閱讀桌**在圖面為一整列，需求書提及「中段／下段」兩組；目前依圖面建為一個區域，如需分段可在 `floor2-layout.js` 拆分。
- 圖面中未命名的深色標示（1F 北側開口、2F 南側中央）以「北側門」「南側深色標示」示意，需館方確認用途。
- 書架分類、書目與新書均為**示範資料**，可串接學校館藏系統 API 取代。
- 英文版目前只翻譯介面文字，教材內容待翻譯。
- 可擴充：第一人稱自由行走、現場照片貼圖、館員後台編輯配置、多人班級排行榜。
