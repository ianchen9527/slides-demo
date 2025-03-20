# 📖 Slides Demo with Excalidraw

這是一個基於 [Excalidraw](https://excalidraw.com/) 白板套件的投影片 demo。
[參考文件](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api)

線上 demo: [https://ianchen9527.github.io/slides-demo](https://ianchen9527.github.io/slides-demo)

---

## ✅ 1. 如何安裝前端環境 (使用 npm)

### 📦 安裝 Dependency

請確認你的環境已經安裝了 Node.js 和 npm。
然後執行以下指令來安裝專案的依賴：

```bash
npm install
```

### 🚀 啟動專案

```bash
npm run dev
```

專案將會在 `http://localhost:5173` 執行。

---

## 📌 2. 核心機制

- 目前是用大張圖片來模擬老師自己的投影片，未來老師的投影片有可能轉成 image 或 HTML5 的格式，目前還不確定。
- 在每張投影片上疊加一個 Excalidraw 白板，白板的背景是透明的，所以使用者可以直接看到後面的投影片。
- 當使用者進到投影片的網址，會立刻被註冊成一個協作者（collaborator），協作者之間透過 websocket 溝通，目前我暫時用 Firebase 作為後端。
- 協作者的滑鼠移動軌跡會以游標或雷射筆的形式呈現在其他協作者的白板上。
- 當使用者在白板上創造元素（任何筆畫或圖形文字都算，只有雷射筆不算），會即時同步到所有人。
- 使用者的翻頁行為也會同步到其他協作者。

---

## 📌 3. 簡單解釋 SlideViewer 在做什麼

`SlideViewer.jsx` 是用來顯示投影片的元件。它的主要功能是：

- 透過 Firebase Firestore 取得對應於 `id` 的投影片資料。
- 將圖片檔渲染為投影片的每一頁。
- 將 `AtBoard` 元件覆蓋在投影片上，支援即時繪畫與協作。

這個元件的核心邏輯是利用 `useParams()` 從網址中提取 `id`，然後從 Firebase 中獲取資料，並建立 websocket 串連所有協作者。

---

## 📌 3. 簡單解釋 AtBoard 在做什麼

`AtBoard.jsx` 是負責渲染 Excalidraw 白板的元件。它的主要功能是：

- 使用 `<Excalidraw />` 元件來建立繪畫畫布。
- 接收來自 Firebase Realtime Database 的 `note` 進行同步更新。
- 將 `note` 資料透過 `excalidrawAPI.updateScene()` 來更新畫布。
- 顯示協作者的滑鼠指標與軌跡 (透過 `collaborators` 參數)。
- 接收來自 Excalidraw 的事件並轉傳。

這個元件是專門用來處理畫布的同步與顯示，不負責投影片的顯示邏輯。

---

### 註解

- 這只是用做 demo，有一些 bug 或流程不順請忽略，重點是驗證關鍵技術可行性。
- 後端目前用私人 firebase realtime database，隨時有可能關閉。
