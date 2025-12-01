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

  <a href="https://ecotrack.asia/api/docs">📖 API Docs</a> •
  <a href="https://ecotrack.asia/aqi">🗺 Bản đồ AQI</a> •
  <a href="https://ecotrack.asia/admin/dashboard">📊 Dashboard Admin</a> •
  <a href="RELEASE_GUIDE.md">🚀 Release Guide</a> •
  <a href="CONTRIBUTING.md">🤝 Đóng Góp</a>
  <a href="CHANGELOG.md">📝 Changelog</a>
</div>

---

## 📋 Tổng Quan

Eco-Track thu thập, chuẩn hoá và lưu trữ dữ liệu chỉ số ô nhiễm không khí (AQI) và thông tin thời tiết theo quận/huyện tại TP. Hồ Chí Minh.  
Dữ liệu thời gian thực được lấy từ OpenAQ API v3 và lưu vào MongoDB để phân tích, trực quan hoá và dự đoán.

Hệ thống cho phép:
- Hiển thị dashboard trực quan (biểu đồ, bản đồ, heatmap)
- Truy vấn dữ liệu theo thời gian và khu vực
- Phân tích xu hướng chất lượng không khí
- Dự đoán AQI ngắn hạn (24 giờ) bằng mô hình ML

---

## 🏗️ Kiến Trúc & Công Nghệ

- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Views: Pug (client & admin)
- Frontend libs: Bootstrap 5, Leaflet.js, Chart.js
- Scheduler: node-cron (thu thập OpenAQ theo giờ)
- ML: Python (NumPy, Pandas, scikit-learn, PyTorch) gọi qua Node

Tham chiếu mã nguồn:
- Cấu hình DB: [config/database.js](config/database.js)
- Mô hình dữ liệu AQI: [models/index.js](models/index.js), các model quận như [models/district1.model.js](models/district1.model.js), [models/hcmc.model.js](models/hcmc.model.js)
- Dữ liệu theo giờ OpenAQ: [models/hcmcAirHour.model.js](models/hcmcAirHour.model.js), [models/hcmcAirindex.model.js](models/hcmcAirindex.model.js)
- Thu thập OpenAQ: [scripts/fetch-openaq-hours.js](scripts/fetch-openaq-hours.js)
- Đồng bộ AQI sang các quận: [services/aqiSyncService.js](services/aqiSyncService.js), [scripts/sync-openaq-to-districts.js](scripts/sync-openaq-to-districts.js)
- API AQI client: [controllers/client/aqi.controller.js](controllers/client/aqi.controller.js)
- API Dự đoán: [controllers/api/prediction.controller.js](controllers/api/prediction.controller.js), Python runner [helpers/pythonRunner.js](helpers/pythonRunner.js), script ML [predict_from_json.py](predict_from_json.py)
- Giao diện: Client [views/client/pages/home/index.pug](views/client/pages/home/index.pug), Docs [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), Admin AQI [views/admin/pages/aqi/index.pug](views/admin/pages/aqi/index.pug), Admin Weather [views/admin/pages/weather/index.pug](views/admin/pages/weather/index.pug)

Lưu ý: Mọi tham chiếu AirVisual đã bị loại bỏ. Script cũ [scripts/fetch-and-save.js](scripts/fetch-and-save.js) không còn được khuyến nghị sử dụng.

---

## ✨ Tính Năng Chính

### 1) 📡 Thu Thập Dữ Liệu (OpenAQ v3)
- Lấy dữ liệu cảm biến theo giờ của TP.HCM từ OpenAQ
- Lưu raw giờ vào collection HCMCAirHour
- Map và chuẩn hoá AQI cho từng quận

Script:
- Thu thập: [scripts/fetch-openaq-hours.js](scripts/fetch-openaq-hours.js)
- Chuyển đổi/quy đổi AQI: [services/aqiSyncService.js](services/aqiSyncService.js)
- Kiểm tra dữ liệu mới nhất: [scripts/check-latest-openaq.js](scripts/check-latest-openaq.js)

### 2) 🗃 Chuẩn Hoá & Lưu Trữ
- Schema chuẩn: `current.pollution` (AQI US, mainus) và `current.weather` (tp, hu, pr, ws, wd)
- Model mỗi quận: ví dụ [models/district3.model.js](models/district3.model.js)
- Thành phố: [models/hcmc.model.js](models/hcmc.model.js)

### 3) 📊 Dashboard & UI
- Client:
  - Trang chủ: [views/client/pages/home/index.pug](views/client/pages/home/index.pug)
  - API docs: [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug)
  - JS bản đồ/heatmap: [public/client/js/script.js](public/client/js/script.js)
- Admin:
  - AQI: [views/admin/pages/aqi/index.pug](views/admin/pages/aqi/index.pug)
  - Weather: [views/admin/pages/weather/index.pug](views/admin/pages/weather/index.pug)

### 4) 🔮 Dự Đoán AQI 24h
- LSTM parameters (JSON) trong `model_params/`
- Dự đoán qua Python: [predict_from_json.py](predict_from_json.py)
- Gọi từ Node: [controllers/api/prediction.controller.js](controllers/api/prediction.controller.js), [helpers/pythonRunner.js](helpers/pythonRunner.js)
- UI dự báo: [public/client/js/forecast.js](public/client/js/forecast.js)

---

## 🌐 API

## 🌐 API

### Standard REST API
- AQI Client Endpoints: xem [controllers/client/aqi.controller.js](controllers/client/aqi.controller.js)
- Prediction Endpoints: xem [controllers/api/prediction.controller.js](controllers/api/prediction.controller.js)
- API Docs giao diện: [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug)

### NGSI-LD API
Eco-Track tuân thủ chuẩn NGSI-LD (ETSI GS CIM 009) cho tương thác Smart City:

- **Context**: `GET /api/ngsi-ld/context`
- **Query Entities**: `GET /api/ngsi-ld/entities/:district`
- **Temporal Query**: `GET /api/ngsi-ld/entities/:district/temporal`
- **All Entities**: `GET /api/ngsi-ld/entities`
- **Predictions**: `POST /api/ngsi-ld/predictions/:district`

Context definition: [public/context/v1.jsonld](public/context/v1.jsonld)

#### Ví dụ sử dụng NGSI-LD:

```bash
# Lấy AQI entity mới nhất
curl -H "Accept: application/ld+json" \
  https://ecotrack.asia/api/ngsi-ld/entities/district1

# Truy vấn temporal (24h gần nhất)
curl "https://ecotrack.asia/api/ngsi-ld/entities/district1/temporal?limit=24"
```

Tích hợp với FIWARE Orion-LD Context Broker:
- Cấu hình trong `.env`: `FIWARE_BROKER_URL`, `FIWARE_USE_ORIONLD=true`
- Service: [services/orionLdSync.service.js](services/orionLdSync.service.js)


---

## 🔧 Yêu Cầu Hệ Thống

- Node.js >= 16.x, npm/yarn
- MongoDB (local/Atlas)
- Python 3.9+ nếu dùng dự đoán
- Git

Biến môi trường (.env) mẫu:
```env
PORT=3000
MONGODB_URL=<your-mongodb-url>

# OpenAQ API
OPENAQ_API_BASE=https://api.openaq.org/v3
OPENAQ_API_KEY=<your-openaq-api-key>
OPENAQ_FETCH_INTERVAL=0 * * * *
SYNC_INTERVAL_MINUTES=30

# Session
SESSION_SECRET=<your-secret>

# SMTP Email
EMAIL_USER=<your-email>
EMAIL_PASS=<your-app-password>
```

---

## 📥 Cài Đặt & Chạy

### 1) Cài đặt
```bash
git clone https://github.com/<your-username>/Eco-Track.git
cd Eco-Track
npm install
```

### 2) Chạy server
```bash
npm run dev
# hoặc
npm start
```
Mặc định: http://localhost:3000

### 3) Kết nối DB
- Cập nhật `MONGODB_URL` trong `.env`
- Kết nối tại [config/database.js](config/database.js)

### 4) Cron thu thập OpenAQ (tùy chọn)
```bash
node scripts/fetch-openaq-hours.js
```

### 5) Seed dữ liệu demo 72h (tùy chọn)
```bash
node scripts/seed-72h-data.js
```

---

## 📁 Cấu Trúc Thư Mục
- `config/` – Cấu hình hệ thống
- `controllers/` – Logic client, admin, api
- `models/` – Schema Mongoose (AQI, thời tiết, giờ, index)
- `routers/` – Định tuyến
- `views/` – Giao diện Pug
- `public/` – Tài nguyên tĩnh
- `scripts/` – Cron, seed, tiện ích
- `helpers/` – Python runner, kiểm tra deps

---

## 🔖 Release
- Hướng dẫn chi tiết: xem [RELEASE_GUIDE.md](RELEASE_GUIDE.md)
- Lịch sử thay đổi: xem [CHANGELOG.md](CHANGELOG.md)
- Quick steps phát hành:
  1) Tăng version trong package.json và cập nhật [CHANGELOG.md](CHANGELOG.md)
  2) Commit: `chore: release vX.Y.Z`
  3) Tạo tag và đẩy lên Git:
     ```bash
     git tag vX.Y.Z
     git push origin vX.Y.Z
     ```
  4) Tạo GitHub Release, đính kèm nội dung từ [CHANGELOG.md](CHANGELOG.md)

---

## 🤝 Đóng Góp
```bash
git checkout -b feat/<ten-tinh-nang>
git commit -m "feat: <mo-ta-ngan-gon>"
git push -u origin feat/<ten-tinh-nang>
```

---

## 🐛 Báo Lỗi & Góp Ý
- Tạo issue: https://github.com/<your-org>/Eco-Track/issues

---

## 📄 Giấy Phép
Phân phối theo GNU GPL v3.0. Xem [LICENSE](LICENSE).

© 2025 Eco-Track – Cùng xây dựng bầu không khí trong lành cho TP. Hồ Chí Minh 🌿