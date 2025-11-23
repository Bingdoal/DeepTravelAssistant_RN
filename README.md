# 📍 Deep Travel Assistant – React Native / Expo App

Deep Travel Assistant 是一款協助旅人「深度旅遊」的 AI 助手 App。  
你可以透過：

- 拍照超市商品、菜單、街頭海報  
- 上傳旅遊景點照片  
- 搭配 GPS 定位  
- 由 AI 模型提供景點介紹、產品解說、文化背景、文字翻譯  
- 每趟旅程可分開儲存資料，支援離線紀錄、本地化存放  

本專案使用 **Expo + React Native + Expo Router** 開發，提供 Android / iOS 版本。

---

## ✨ 功能特色

### 🧭 1. 旅程管理（Journey System）
每趟旅程都是獨立工作區，支援：

- 旅程名稱（例如：西班牙自由行）
- 旅程地點 / 國家
- 每個旅程有獨立的對話與照片紀錄
- App 重開後自動回到「上次使用的旅程與頁面」

---

### 💬 2. 多分類 AI 對話
旅程首頁可選擇：

- 🍽 **菜單助手（Menu）**
- 🛒 **超市助手（Supermarket）**
- 🗺 **景點助手（Attractions）**

每個類別都有獨立分頁與資料儲存。

---

### 📸 3. 相機 & 圖片上傳解析
- 支援相機拍照  
- 支援一次多張圖片選取  
- 自動壓縮 / Resize / Base64  
- 圖片儲存在本地（不會上傳雲端）  

---

### 📍 4. GPS 定位整合
每次詢問時會取用 GPS，例如：

- 拍某家餐廳菜單 → AI 可根據位置推測語言、文化背景  
- 景點拍照 → AI 可更準確提供資訊

---

### 💾 5. 本地資料儲存（AsyncStorage）
保存：

- API Key  
- AI 模型  
- 每個旅程的聊天紀錄（含圖片）  
- 使用者最後停留頁面與旅程狀態  

App 重啟後自動恢復。

---

### 🔍 6. 對話搜尋（全文匹配）
- 支援搜尋訊息內容
- 搜尋欄可開關
- 即時篩選訊息

---

### 🌓 7. 暗黑模式 UI
- 全系統深色介面  
- ChatGPT 風格聊天泡泡  
- iOS / Android 一致的體驗  

---

## 🛠️ 技術架構

### **主要框架**
- Expo SDK  
- React Native  
- Expo Router  
- TypeScript  

### **Native 模組**
- `expo-image-picker`
- `expo-image-manipulator`
- `expo-location`
- `react-native-safe-area-context`
- `@react-native-async-storage/async-storage`

### **UI**
- Ionicons  
- React Native StyleSheet  
- 自製全局暗色主題：`constants/colors.ts`