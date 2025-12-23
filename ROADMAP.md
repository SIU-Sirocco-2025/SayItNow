# Eco-Track – Roadmap

Tài liệu này mô tả các định hướng phát triển chính của Eco‑Track trong tương lai gần, trung hạn và dài hạn.  
Mục tiêu chung: trở thành nền tảng dữ liệu mở về môi trường đô thị (đặc biệt là chất lượng không khí) cho TP. Hồ Chí Minh, dựa trên **mạng lưới cảm biến do dự án tự triển khai** (không phụ thuộc dữ liệu AQI bên thứ ba), tuân thủ NGSI‑LD, FIWARE Smart Data Models và các nguyên tắc dữ liệu mở/FAIR.

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
  - Làm rõ hơn mapping giữa NGSI‑LD ↔ FIWARE Smart Data Models ↔ SOSA/SSN trong tài liệu  
    (section tương ứng trong [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug)).

### 1.2. Dữ liệu & pipeline (cảm biến nội bộ)

- Thiết kế và triển khai pipeline thu thập dữ liệu từ **các cảm biến vật lý**:
  - Giai đoạn 1: pilot 1–N cảm biến tại **phường An Khánh (TP. Thủ Đức, TP.HCM)**.
  - Chuẩn hoá giao thức truyền dữ liệu (MQTT/HTTP) và format payload.
  - Xây dựng dịch vụ thu thập & lưu trữ vào MongoDB theo schema hiện tại (`current.pollution`, `current.weather`).
- Đảm bảo chất lượng dữ liệu:
  - Theo dõi chất lượng dữ liệu (thiếu giờ, giá trị outlier, trễ cập nhật).
  - Cơ chế health‑check cho từng cảm biến (online/offline, pin, tín hiệu).
  - Ghi log có cấu trúc cho service thu thập (phục vụ debug và audit).
- Bổ sung script tiện ích:
  - Thống kê nhanh độ phủ dữ liệu theo ngày/tháng cho từng cảm biến/khu vực.
  - So sánh chéo (nếu cần) với nguồn tham chiếu độc lập để hiệu chuẩn, nhưng **không phụ thuộc** vào nguồn bên thứ ba cho vận hành thường ngày.

### 1.3. Cộng đồng & tài liệu

- Bổ sung ví dụ sử dụng API trong ngôn ngữ khác (Python, JavaScript client):
  - Section mới trong [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug).
- Thêm hướng dẫn “Getting Started cho Contributor”:
  - Flow nhanh từ `git clone` → `npm install` → seed 72h → chạy UI → test NGSI‑LD.
- Cải thiện ghi chú về giấy phép dữ liệu mở:
  - Làm rõ phân biệt giữa:
    - Dữ liệu do Eco‑Track **tự thu thập qua cảm biến** (primary source).
    - Bất kỳ nguồn tham chiếu phụ (nếu có) và cách ghi công tương ứng.
  - Cập nhật trong [DATA_LICENSE.md](DATA_LICENSE.md).

---

## 2. Trung hạn (3–9 tháng)

### 2.1. Mở rộng mạng lưới cảm biến trong TP.HCM

- Từ pilot ở phường An Khánh:
  - Mở rộng sang thêm các phường/quận khác trong TP. Thủ Đức và các quận lân cận.
  - Thiết lập tiêu chí chọn vị trí lắp đặt (mật độ dân cư, gần trục giao thông, khu công nghiệp, khu trường học).
- Thiết kế lại cấu trúc models để:
  - Hỗ trợ nhiều trạm/cảm biến trong **cùng một thành phố** (nhiều điểm đo cho từng quận/phường).
  - Lưu metadata cảm biến (loại sensor, nhà sản xuất, độ chính xác, thời gian hiệu chuẩn) trong MongoDB.
- Xây dựng dashboard quản lý cảm biến:
  - Theo dõi trạng thái hoạt động, số bản ghi/ngày, cảnh báo khi mất kết nối hoặc dữ liệu bất thường.

### 2.2. NGSI‑LD & Smart Data Models nâng cao

- Bổ sung thêm entity NGSI‑LD mới dựa trên FIWARE Smart Data Models, ví dụ:
  - `AirQualityObserved` (theo từng cảm biến).
  - `WeatherObserved` (nếu có tích hợp cảm biến thời tiết riêng).
  - `NoiseLevelObserved` (khi triển khai cảm biến tiếng ồn).
- Tách logic NGSI‑LD thành module rõ ràng:
  - Converter riêng cho mỗi entity type trong [helpers/ngsiLdConverter.js](helpers/ngsiLdConverter.js).
  - Test script tương ứng cho từng entity trong `scripts/`.
- Thiết kế `@context` và URN cho từng **sensor**, **station**, **khu vực** để dễ mở rộng.

### 2.3. ML & phân tích nâng cao

- Cải thiện mô hình LSTM hiện tại trên **dữ liệu cảm biến thật**:
  - Thử thêm nhiều đặc trưng (weather features, time‑of‑day, day‑of‑week, metadata cảm biến).
  - So sánh các mô hình (baseline, Random Forest, XGBoost, LSTM).
- Thêm API phân tích:
  - Dự báo xu hướng nhiều ngày (3–7 ngày) với độ tin cậy ghi rõ.
  - Endpoint phân tích “hotspot” theo thời gian và khu vực (phường/quận).
- Nghiên cứu thêm các chỉ số sức khoẻ/heatwave (kết hợp nhiệt độ – độ ẩm) từ dữ liệu thu thập.

---

## 3. Dài hạn (9–24 tháng)

### 3.1. Hướng tới nền tảng Smart City đa domain (trên nền dữ liệu cảm biến riêng)

- Thiết kế lại kiến trúc để:
  - Hỗ trợ nhiều domain dữ liệu: giao thông, môi trường, dịch vụ công cộng… dựa trên các cảm biến do dự án vận hành hoặc đối tác cung cấp dữ liệu mở.
  - Sử dụng NGSI‑LD như lớp chia sẻ dữ liệu lõi.
- Tích hợp với các nền tảng/người dùng khác:
  - Cho phép “plugin” bên ngoài truy cập/subscribe dữ liệu NGSI‑LD (MQTT/HTTP subscription).
  - Cổng dữ liệu mở (Open Data Portal mini) cho các dataset do Eco‑Track tạo.

### 3.2. Khả năng mở rộng & vận hành

- Cải thiện scaling & observability:
  - Sử dụng logging có cấu trúc (JSON logs) cho cron/scripts và dịch vụ thu thập cảm biến.
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
- **Dữ liệu do dự án tự thu thập là nguồn chính:** ưu tiên dữ liệu từ mạng lưới cảm biến Eco‑Track, **không phụ thuộc** hoàn toàn vào API/dữ liệu AQI bên thứ ba cho vận hành sản phẩm.  
- **Dữ liệu mở & FAIR:** mọi API NGSI‑LD phải có `@context`, URN rõ ràng, và metadata về nguồn gốc dữ liệu/cảm biến.  
- **Tương thích chuẩn:** mọi mở rộng entity mới ưu tiên dựa trên FIWARE Smart Data Models và SOSA/SSN.  
- **Trải nghiệm người dùng:** mọi tính năng backend mới đều nên có UI hoặc docs minh bạch trong [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug).  

Roadmap này là tài liệu sống và sẽ được cập nhật sau mỗi bản phát hành lớn (xem [CHANGELOG.md](CHANGELOG.md)).