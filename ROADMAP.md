# Eco-Track – Roadmap

Tài liệu này mô tả các định hướng phát triển chính của Eco‑Track trong tương lai gần, trung hạn và dài hạn.  
Mục tiêu chung: trở thành nền tảng dữ liệu mở về môi trường đô thị (đặc biệt là chất lượng không khí) cho các thành phố ở Việt Nam, tuân thủ NGSI‑LD, FIWARE Smart Data Models và các nguyên tắc dữ liệu mở/FAIR.

---

## 1. Ngắn hạn (0–3 tháng)

### 1.1. Ổn định sản phẩm hiện tại

- Hoàn thiện kiểm thử thủ công cho các luồng chính:
  - Client:  
    - Trang bản đồ AQI, lịch sử 72h, xu hướng, thống kê  
    - Dự đoán AQI 24h (UI + API)
  - Admin:  
    - Dashboard tổng quan (AQI, thời tiết, cảnh báo, ranking)  
    - Export CSV/JSON, quản lý người dùng, ticket phản hồi
- Cải thiện trải nghiệm NGSI‑LD:
  - Bổ sung ví dụ JSON‑LD nâng cao trong docs:  
    - `AirQualityObserved` kèm `observedProperty`, `hasFeatureOfInterest`, `location` rõ ràng  
    - `AQIPrediction` với nhiều khung thời gian
  - Làm rõ hơn mapping giữa NGSI‑LD ↔ FIWARE Smart Data Models ↔ SOSA/SSN trong tài liệu.

### 1.2. Dữ liệu & pipeline

- Tối ưu pipeline OpenAQ:
  - Theo dõi chất lượng dữ liệu (thiếu giờ, giá trị outlier, trễ cập nhật).
  - Cải thiện log trong các script:
    - [`scripts/fetch-openaq-hours.js`](scripts/fetch-openaq-hours.js)
    - [`scripts/sync-openaq-to-districts.js`](scripts/sync-openaq-to-districts.js)
- Bổ sung script tiện ích:
  - Kiểm tra tính nhất quán dữ liệu giữa `hcmc_air_hours` và các collection quận.
  - Thống kê nhanh độ phủ dữ liệu theo ngày/tháng.

### 1.3. Cộng đồng & tài liệu

- Bổ sung ví dụ sử dụng API trong ngôn ngữ khác (Python, JavaScript client):
  - Section mới trong [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug).
- Thêm hướng dẫn “Getting Started cho Contributor”:
  - Flow nhanh từ `git clone` → `npm install` → seed 72h → chạy UI → test NGSI‑LD.
- Cải thiện ghi chú về giấy phép dữ liệu mở:
  - Liên kết rõ hơn giữa `DATA_LICENSE.md`, OpenAQ license, OSM contributors.

---

## 2. Trung hạn (3–9 tháng)

### 2.1. Mở rộng phạm vi địa lý & domain

- Mở rộng từ TP.HCM sang:
  - Tối thiểu 1–2 thành phố khác (ví dụ: Hà Nội, Đà Nẵng) nếu dữ liệu phù hợp.
  - Thiết kế lại cấu trúc models để hỗ trợ nhiều thành phố trong cùng hệ thống.
- Mở rộng domain dữ liệu đô thị (tuỳ dữ liệu mở sẵn có):
  - Tiếng ồn, nhiệt độ bề mặt, hoặc chỉ số heatwave (nhiệt độ – độ ẩm).
  - Dịch vụ công cộng dễ tích hợp (công viên, bãi đỗ xe, trạm xe buýt) nếu có nguồn mở (OSM/GTFS).

### 2.2. NGSI‑LD & Smart Data Models nâng cao

- Bổ sung thêm entity NGSI‑LD mới dựa trên FIWARE Smart Data Models, ví dụ:
  - `WeatherObserved`
  - `NoiseLevelObserved`
  - `PointOfInterest` (cho một số dịch vụ công cộng cơ bản).
- Tách logic NGSI‑LD thành module rõ ràng:
  - Converter riêng cho mỗi entity type trong [`helpers/ngsiLdConverter.js`](helpers/ngsiLdConverter.js).
  - Test script tương ứng cho từng entity trong `scripts/`.

### 2.3. ML & phân tích nâng cao

- Cải thiện mô hình LSTM hiện tại:
  - Thử thêm nhiều đặc trưng (weather features, time-of-day, day-of-week).
  - So sánh các mô hình (baseline, Random Forest, XGBoost, LSTM).
- Thêm API phân tích:
  - Dự báo xu hướng nhiều ngày (3–7 ngày) với độ tin cậy ghi rõ.
  - Endpoint phân tích “hotspot” theo thời gian và khu vực.

---

## 3. Dài hạn (9–24 tháng)

### 3.1. Hướng tới nền tảng Smart City đa domain

- Thiết kế lại kiến trúc để:
  - Hỗ trợ nhiều domain dữ liệu: giao thông, môi trường, dịch vụ công cộng.
  - Sử dụng NGSI‑LD như lớp chia sẻ dữ liệu lõi.
- Tích hợp với các nền tảng/người dùng khác:
  - Cho phép “plugin” bên ngoài truy cập/subscribe dữ liệu NGSI‑LD.
  - Cổng dữ liệu mở (Open Data Portal mini) cho các dataset do Eco‑Track tạo.

### 3.2. Khả năng mở rộng & vận hành

- Cải thiện scaling & observability:
  - Sử dụng logging có cấu trúc (JSON logs) cho cron/scripts.
  - Xem xét thêm support cho clustering / horizontal scaling (PM2 cluster, container).
- Cân nhắc CI/CD:
  - Thiết lập pipeline cơ bản (lint/test/build) khi có điều kiện hạ tầng.
  - Tự động cập nhật docs API khi code thay đổi (semi‑automatic).

### 3.3. Cộng đồng & quản trị dự án

- Định kỳ phát hành:
  - Lên nhịp release (ví dụ mỗi 3–4 tháng) theo guide trong [RELEASE_GUIDE.md](RELEASE_GUIDE.md).
  - Gắn milestone/issue cho từng phiên bản lớn.
- Khuyến khích cộng đồng:
  - “Good first issue” / “help wanted” label cho người mới.
  - Ghi nhận đóng góp trong [CHANGELOG.md](CHANGELOG.md) hoặc phần “Contributors”.

---

## 4. Nguyên tắc chung

- **Mã nguồn mở:** giữ GPL‑3.0 cho code, CC BY 4.0 cho dataset NGSI‑LD (xem [LICENSE](LICENSE), [DATA_LICENSE.md](DATA_LICENSE.md)).  
- **Dữ liệu mở & FAIR:** mọi API NGSI‑LD phải có `@context`, URN rõ ràng, và metadata về nguồn gốc dữ liệu.  
- **Tương thích chuẩn:** mọi mở rộng entity mới ưu tiên dựa trên FIWARE Smart Data Models và SOSA/SSN.  
- **Trải nghiệm người dùng:** mọi tính năng backend mới đều nên có UI hoặc docs minh bạch trong [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug).  

Roadmap này là tài liệu sống và sẽ được cập nhật sau mỗi bản phát hành lớn (xem [CHANGELOG.md](CHANGELOG.md)).