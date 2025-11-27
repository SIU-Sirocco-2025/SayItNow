<div align="center">
  <img src="public/client/image/logo.png" alt="Eco-Track Logo" width="200"/>

  # Eco-Track 🌿
  ### Hệ Thống Theo Dõi & Dự Đoán Chất Lượng Không Khí TP.HCM

  > "Theo dõi hôm nay để bảo vệ bầu trời ngày mai."

  [![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE)

  <a href="http://ecotrack.asia">
    <img src="https://img.shields.io/badge/🚀_Demo-Eco_Track-00C853?style=for-the-badge" alt="Demo System"/>
  </a>
  <a href="http://ecotrack.asia/api/docs">
    <img src="https://img.shields.io/badge/📚_Docs-Eco_Track-1976D2?style=for-the-badge" alt="Documentation"/>
  </a>

  <br/>

  <a href="http://localhost:3000/api/docs">📖 API Docs</a> •
  <a href="http://localhost:3000/aqi">🗺 Bản đồ AQI</a> •
  <a href="/admin/dashboard">📊 Dashboard Admin</a> •
  <a href="CONTRIBUTING.md">🤝 Đóng Góp</a>
</div>

---

## 📋 Tổng Quan

**Eco-Track** là dự án mã nguồn mở của đội **SIU_Sirocco (SIU)** nhằm thu thập, chuẩn hoá và lưu trữ dữ liệu **chỉ số ô nhiễm không khí (AQI)** và **thông tin thời tiết** theo quận/huyện tại TP. Hồ Chí Minh.  
Dữ liệu được lấy từ **AirVisual API** và **OpenAQ**, lưu vào **MongoDB** để phân tích, trực quan hoá và dự đoán.

Hệ thống cho phép:
- Hiển thị dashboard trực quan (biểu đồ, bản đồ, heatmap)
- Truy vấn dữ liệu theo thời gian và khu vực
- Phân tích xu hướng chất lượng không khí
- Dự đoán AQI & thời tiết ngắn hạn (1–24 giờ) bằng mô hình ML

---

## 🏗️ Kiến Trúc & Công Nghệ

### 💻 Công Nghệ Nền Tảng

| 🛠️ Công Nghệ | 🎯 Vai Trò | 🌟 Ghi chú |
| --- | --- | --- |
| Node.js & Express.js | Backend, router, controller | Tổ chức theo mô-đun: `controllers/`, `routers/`, `middlewares/` |
| MongoDB & Mongoose | Lưu trữ dữ liệu thời gian thực | Model trong `models/` (`DistrictX`, `HCMC`, `HCMCAirHour`, `HCMCAirIndex`, …) |
| Pug (Jade) | View engine cho web client & admin | Thư mục `views/` với layout client/admin riêng |
| Bootstrap 5, Leaflet.js, Chart.js | UI, bản đồ AQI, biểu đồ | Tài nguyên tĩnh trong `public/client` và `public/admin` |
| Python (NumPy, Pandas, scikit-learn, PyTorch) | Mô-đun ML/LSTM dự đoán AQI | Script `predict_from_json.py`, chạy qua `helpers/pythonRunner.js` |
| node-cron | Scheduler / cronjob | `scripts/fetch-and-save.js`, `scripts/fetch-openaq-hours.js` |
| dotenv | Cấu hình biến môi trường | Dùng trong `config/database.js`, các script thu thập dữ liệu |

---

## ✨ Tính Năng Chính

### 1) 📡 Thu Thập Dữ Liệu Thời Gian Thực
- Lấy dữ liệu từ AirVisual API cho các quận/huyện:
  - Script: `scripts/fetch-and-save.js`
  - Map quận ↔ model: `CITY_MAP`
- Cron job với `node-cron`, cấu hình qua biến môi trường:
  - `CRON_ENABLED`, `API_DELAY_MS`, `API_MAX_RETRY`, `ALLOW_DB_WRITE`
- Lưu dữ liệu vào các collection MongoDB theo từng quận và toàn thành phố.

### 2) 🗃 Chuẩn Hoá & Lưu Trữ Dữ Liệu
- Dùng `models/baseReadingSchema.js` để chuẩn hoá:
  - `current.pollution` (AQI US/CN, chất ô nhiễm chính)
  - `current.weather` (nhiệt độ, độ ẩm, áp suất, gió, …)
- Hỗ trợ đọc/ghi dữ liệu lịch sử 72h cho từng quận/huyện.
- Kết hợp dữ liệu OpenAQ theo giờ qua `scripts/fetch-openaq-hours.js` và model `HCMCAirHour`.

### 3) 📊 Dashboard & Giao Diện Web
- Client (`controllers/client`, `views/client`):
  - Trang chủ, giới thiệu, bản đồ chất lượng không khí, trang tài liệu API
- Admin (`controllers/admin`, `views/admin`):
  - Dashboard tổng quan AQI & thời tiết
  - Quản lý dữ liệu AQI, thời tiết, người dùng (tùy cấu hình)

### 4) 🔮 Dự Đoán AQI & Thời Tiết
Tích hợp mô-đun AI/ML dự đoán xu hướng AQI và thông số thời tiết cho từng quận/huyện trong 1–24 giờ.

- Mục tiêu: AQI ngắn hạn, thông số thời tiết, cảnh báo xu hướng
- Pipeline:
  1. Tiền xử lý chuỗi dữ liệu 72h gần nhất
  2. Thuật toán: ARIMA/SARIMA, LSTM, Moving Average
  3. Trả về dự đoán 1–24 giờ cho từng quận/huyện

Core: `predict_from_json.py` (gọi từ Node qua `helpers/pythonRunner.js`).

---

## 🌐 API Chính

### API Dự Đoán
- Controller: `controllers/api/prediction.controller.js`
- Endpoint (ví dụ):
  - `GET /api/prediction/get-72h-data/:district`
  - `GET /api/prediction/forecast-24h/:district`
  - `GET /api/prediction/districts`

### API AQI & Thời Tiết
- Lịch sử AQI 72h theo quận/huyện
- Dữ liệu theo khoảng thời gian (from–to)
- So sánh AQI giữa các khu vực
- Thống kê, xu hướng, xuất CSV/JSON

API Docs (Pug): `views/client/pages/docs`.

---

## 🔧 Yêu Cầu Hệ Thống

### 🛠 Phần Mềm Bắt Buộc
- Node.js >= 16.x
- npm hoặc yarn
- MongoDB (local hoặc Atlas)
- Python 3.9+ (khuyến nghị) nếu dùng dự đoán
- Git

### ⚙️ Biến Môi Trường (.env)
Tạo file `.env` tại thư mục gốc, ví dụ:
```env
MONGODB_URL=mongodb://localhost:27017/eco-track

# AirVisual API
API_BASE=http://api.airvisual.com/v2/city
API_KEY=YOUR_AIRVISUAL_API_KEY
STATE=ho chi minh city
COUNTRY=vietnam
CRON_ENABLED=1
API_DELAY_MS=6500
API_MAX_RETRY=3
ALLOW_DB_WRITE=1

# OpenAQ API
OPENAQ_API_BASE=https://api.openaq.org/v3
OPENAQ_API_KEY=YOUR_OPENAQ_API_KEY
OPENAQ_FETCH_INTERVAL=0 * * * *
```

---

## 📥 Hướng Dẫn Cài Đặt & Chạy

### 1) Cài Đặt Dự Án
```bash
git clone https://github.com/<your-username>/Eco-Track.git
cd Eco-Track
npm install
# hoặc
yarn install
```

### 2) Chạy Server
```bash
npm run dev
# hoặc
npm start
```
Mặc định server: http://localhost:3000

### 3) Kết Nối Database
- Đảm bảo MongoDB đang chạy (local hoặc remote)
- Kiểm tra `MONGODB_URL` trong `.env`
- Khởi tạo kết nối tại `config/database.js`

### 4) Chạy Cron Thu Thập Dữ Liệu (tùy chọn)
```bash
node scripts/fetch-and-save.js
node scripts/fetch-openaq-hours.js
```

### 5) Seed Dữ Liệu 72h Cho Prediction (tùy chọn)
```bash
node scripts/seed-72h-data.js
```

---

## 📁 Cấu Trúc Thư Mục Chính
- `config/` – Cấu hình database, hệ thống
- `controllers/` – Logic cho client, admin, api
- `models/` – Schema Mongoose cho AQI, thời tiết, giờ, index, …
- `routers/` – Định tuyến cho client, admin, api
- `views/` – Giao diện Pug (client & admin)
- `public/` – CSS, JS, hình ảnh, dữ liệu tĩnh
- `scripts/` – Script cron, seed, debug
- `helpers/` – Tiện ích chung (Python runner, gửi mail, …)

---

## 🤝 Đóng Góp Cho Dự Án
```bash
# Fork repository
git clone https://github.com/<your-username>/Eco-Track.git
cd Eco-Track

# Tạo branch mới
git checkout -b feat/<ten-tinh-nang>

# Commit thay đổi
git add .
git commit -m "feat: <mo-ta-ngan-gon>"

# Push & tạo Pull Request
git push -u origin feat/<ten-tinh-nang>
```

---

## 🐛 Báo Cáo Lỗi & Góp Ý
- Tạo issue: https://github.com/<your-org>/Eco-Track/issues  
- Vui lòng mô tả rõ lỗi, môi trường, log và bước tái hiện.

---

## 📄 Giấy Phép
Dự án được phân phối theo giấy phép GNU General Public License v3.0.  
Xem chi tiết tại file `LICENSE`.

---

© 2025 Eco-Track – Cùng xây dựng bầu không khí trong lành cho TP. Hồ Chí Minh 🌿
