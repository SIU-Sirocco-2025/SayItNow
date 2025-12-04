# CHANGELOG
## [v1.1.0](https://github.com/SIU-Sirocco-2025/Eco-Track/releases/tag/v1.1.0) - 2025-12-04
### Added
- Endpoint ngữ cảnh NGSI‑LD và các cải tiến liên quan ([routers/api/ngsiLd.route.js](routers/api/ngsiLd.route.js), [controllers/api/aqiNgsiLd.controller.js](controllers/api/aqiNgsiLd.controller.js), [config/ngsi-ld-context.js](config/ngsi-ld-context.js))
- Endpoint thu thập dự đoán dạng NGSI‑LD Collection và các hàm chuyển đổi tiện ích ([controllers/api/prediction.controller.js](controllers/api/prediction.controller.js), [helpers/ngsiLdConverter.js](helpers/ngsiLdConverter.js), [routers/api/ngsiLd.route.js](routers/api/ngsiLd.route.js))
- Script kiểm thử cho các endpoint NGSI‑LD ([scripts/test-ngsi-ld.js](scripts/test-ngsi-ld.js))
- Cải tiến giao diện tài liệu Client: giới thiệu NGSI‑LD, context, entities, truy vấn temporal, dự đoán, ví dụ request/response, bộ chuyển đổi base URL ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), [public/client/js/docs.js](public/client/js/docs.js), [public/client/css/docs.css](public/client/css/docs.css))
- Logic tải và hiển thị biểu đồ chi tiết thời tiết trên trang Admin ([views/admin/pages/weather/detail.pug](views/admin/pages/weather/detail.pug))
- Biểu đồ nhiệt độ/độ ẩm trên trang Dashboard Admin ([views/admin/pages/dashboard/index.pug](views/admin/pages/dashboard/index.pug))
- Tùy biến thương hiệu và thông báo trên trang đăng nhập ([views/client/pages/auth/login.pug](views/client/pages/auth/login.pug))
- Layout heatmap cho Leaflet và các plugin đi kèm ([views/client/layouts/heatmap.pug](views/client/layouts/heatmap.pug))
- Header tài liệu: điều hướng và dropdown người dùng hiện tại ([views/client/partials/header.pug](views/client/partials/header.pug))
- Trang quản lý người dùng trên Admin: danh sách và form thêm nhanh ([views/admin/pages/users/index.pug](views/admin/pages/users/index.pug))
- Trang cài đặt Admin cho cập nhật mật khẩu với thông báo lỗi/thành công ([views/admin/pages/settings/index.pug](views/admin/pages/settings/index.pug))
- Mixin cho xử lý nhiều form trong một trang (client/admin) ([views/client/mixins/formChangeMulti.pug](views/client/mixins/formChangeMulti.pug), [views/admin/mixins/formChangeMulti.pug](views/admin/mixins/formChangeMulti.pug))
- Mixin giấy phép và giới thiệu dùng chung cho các trang client ([views/client/mixins/about.pug](views/client/mixins/about.pug))
- Tài liệu về context, ghi chú FAIR/LOD trong giấy phép dữ liệu ([DATA_LICENSE.md](DATA_LICENSE.md))
- Cập nhật tài liệu phát hành và lộ trình ([RELEASE_GUIDE.md](RELEASE_GUIDE.md), [ROADMAP.md](ROADMAP.md))
- Mục NGSI‑LD và ví dụ sử dụng trong README ([README.md](README.md))

### Changed
- Chuẩn hoá mapping JSON‑LD context NGSI‑LD cho AirQualityObserved, các chất ô nhiễm, thuộc tính địa lý, entity AQIReading cũ và các thuộc tính thời tiết ([config/ngsi-ld-context.js](config/ngsi-ld-context.js))
- Refactor controller NGSI‑LD để:
    - Cung cấp context qua `/api/ngsi-ld/context` ([controllers/api/aqiNgsiLd.controller.js](controllers/api/aqiNgsiLd.controller.js))
    - Truy vấn một entity `/api/ngsi-ld/entities/:district` và truy vấn temporal `/api/ngsi-ld/entities/:district/temporal` với tham số limit, time range ([controllers/api/aqiNgsiLd.controller.js](controllers/api/aqiNgsiLd.controller.js))
    - Truy vấn tất cả entities qua `/api/ngsi-ld/entities` với limit ([controllers/api/aqiNgsiLd.controller.js](controllers/api/aqiNgsiLd.controller.js))
- Nâng cấp helper chuyển đổi NGSI‑LD:
    - `toNGSILD`, `toNGSILDArray` cho bản ghi AQI
    - `predictionToNGSILD` cho dữ liệu dự đoán 24h
    - Export `NGSI_LD_CONTEXT` để tái sử dụng ([helpers/ngsiLdConverter.js](helpers/ngsiLdConverter.js))
- Controller prediction trả về NGSI‑LD Collection với `@context`, `type`, `member` đầy đủ và hỗ trợ Accept header NGSI‑LD ([controllers/api/prediction.controller.js](controllers/api/prediction.controller.js))
- Mở rộng tài liệu client với các phần NGSI‑LD mới, bảng tham số, ví dụ request/response và mã lỗi; thêm lựa chọn base URL và cập nhật syntax highlighting ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), [public/client/js/docs.js](public/client/js/docs.js), [public/client/css/docs.css](public/client/css/docs.css))
- Điều chỉnh nhãn legend và chuỗi UI trong script client cho rõ ràng hơn ([public/client/js/script.js](public/client/js/script.js))
- Gom nhóm export và mapping trong controller admin thời tiết (import model quận và export CSV) ([controllers/admin/weather.controller.js](controllers/admin/weather.controller.js))
- Giữ nguyên logic export trong controller admin AQI nhưng cải thiện header file và đường dẫn import ([controllers/admin/aqi.controller.js](controllers/admin/aqi.controller.js))
- Thiết lập server index: khởi tạo passport, session/flash, inject biến locals, phục vụ static TinyMCE, middleware inject user ([index.js](index.js))
- Cập nhật file tổng hợp models để bao gồm quận và TP.HCM trong một index chung ([models/index.js](models/index.js))
- Tạo/cập nhật model cho các quận với schema đọc dữ liệu cơ bản và cấu hình collection ([models/phuNhuan.model.js](models/phuNhuan.model.js), [models/binhTan.model.js](models/binhTan.model.js))
- Cập nhật hướng dẫn phát hành và giấy phép dependencies cho phù hợp phiên bản package hiện tại và tham chiếu NGSI‑LD ([RELEASE_GUIDE.md](RELEASE_GUIDE.md), [DEPENDENCIES_LICENSES.md](DEPENDENCIES_LICENSES.md))
- Cập nhật README với cách dùng API NGSI‑LD, tham chiếu context, cấu trúc thư mục và link hướng dẫn PM2 ([README.md](README.md))

### Fixed
- Sửa loại và ID thuộc tính trong NGSI‑LD context (dateObserved, airQualityIndex, pollutants, mapping GeoProperty) ([config/ngsi-ld-context.js](config/ngsi-ld-context.js))
- Xử lý truy vấn temporal: validate `timeAt`, `endTimeAt`, `limit`; sắp xếp, giới hạn đúng; đặt header Content‑Type JSON‑LD ([controllers/api/aqiNgsiLd.controller.js](controllers/api/aqiNgsiLd.controller.js))
- Định dạng lại phản hồi NGSI‑LD cho prediction, đảm bảo `@context` và lớp bọc Collection; chuẩn hoá xử lý lỗi ([controllers/api/prediction.controller.js](controllers/api/prediction.controller.js))
- Bộ chuyển đổi base URL trong docs nay thay thế nhất quán cả localhost và URL production, đồng thời áp dụng lại syntax highlighting ([public/client/js/docs.js](public/client/js/docs.js))
- Script in model mới nhất cho từng quận với thông điệp lỗi rõ ràng ([scripts/print-latest.js](scripts/print-latest.js))
- Sửa lỗi giao diện nhỏ cho badge mức độ ưu tiên và layout actions trong chi tiết ticket admin ([views/admin/pages/ticket/detail.pug](views/admin/pages/ticket/detail.pug))
- Ổn định tuỳ chọn render biểu đồ thời tiết với legend và thiết lập font ([views/admin/pages/weather/detail.pug](views/admin/pages/weather/detail.pug))

### Deprecated
- Gỡ tham chiếu AirVisual cũ khỏi tài liệu và ghi chú; script fetch cũ được đánh dấu là không khuyến nghị dùng ([README.md](README.md))


---
## [v1.0.0](https://github.com/SIU-Sirocco-2025/Eco-Track/releases/tag/v1.0.0) - 2025-11-30

### Added
- Thu thập dữ liệu AQI từ OpenAQ theo giờ ([scripts/fetch-openaq-hours.js](scripts/fetch-openaq-hours.js), [models/hcmcAirHour.model.js](models/hcmcAirHour.model.js), [models/hcmcAirindex.model.js](models/hcmcAirindex.model.js))
- Dịch vụ đồng bộ dữ liệu AQI 72h và realtime khi khởi động server ([services/aqiSyncService.js](services/aqiSyncService.js), gọi từ [index.js](index.js))
- API dự đoán AQI 24h cho từng quận/huyện bằng Python LSTM ([controllers/api/prediction.controller.js](controllers/api/prediction.controller.js), [helpers/pythonRunner.js](helpers/pythonRunner.js), [predict_from_json.py](predict_from_json.py))
- Trang Dashboard Admin: tổng quan AQI, thời tiết, cảnh báo, biểu đồ, export CSV/JSON ([views/admin/pages/dashboard/index.pug](views/admin/pages/dashboard/index.pug), [controllers/admin/aqi.controller.js](controllers/admin/aqi.controller.js), [controllers/admin/weather.controller.js](controllers/admin/weather.controller.js))
- Trang Client: bản đồ AQI, heatmap, hero status, khuyến nghị theo mức AQI, docs API ([views/client/pages/home/index.pug](views/client/pages/home/index.pug), [public/client/js/script.js](public/client/js/script.js), [public/client/js/forecast.js](public/client/js/forecast.js), [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug))
- Hệ thống ticket phản hồi người dùng (client + admin) với email thông báo và cập nhật trạng thái/độ ưu tiên ([models/ticket.model.js](models/ticket.model.js), [controllers/client/ticket.controller.js](controllers/client/ticket.controller.js), [controllers/admin/ticket.controller.js](controllers/admin/ticket.controller.js), [views/admin/pages/ticket/index.pug](views/admin/pages/ticket/index.pug))
- Quản lý tài khoản người dùng (đăng ký/đăng nhập/đổi mật khẩu, lấy API key, cài đặt) ([views/client/pages/auth/*](views/client/pages/auth), [controllers/admin/settings.controller.js](controllers/admin/settings.controller.js), [views/admin/pages/settings/index.pug](views/admin/pages/settings/index.pug))
- Seed dữ liệu mẫu 72h phục vụ prediction ([scripts/seed-72h-data.js](scripts/seed-72h-data.js)) và reset dữ liệu quận ([scripts/reset-district-data.js](scripts/reset-district-data.js))
- Tài liệu API đầy đủ với ví dụ request/response ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), [public/client/css/docs.css](public/client/css/docs.css))
- Cấu hình TinyMCE cho client/admin ([public/client/js/tinymce-config.js](public/client/js/tinymce-config.js), [public/admin/js/tinymce-config.js](public/admin/js/tinymce-config.js))

### Changed
- Chuẩn hoá tính AQI từ các pollutants (PM2.5, PM10, O3, NO2, SO2, CO) và tổng hợp AQI chính ([services/aqiSyncService.js](services/aqiSyncService.js), [scripts/sync-openaq-to-districts.js](scripts/sync-openaq-to-districts.js))
- Cải thiện giao diện trang chủ: hero động, khuyến nghị theo AQI, legend, statusbar, hiệu ứng UI ([public/client/css/style.css](public/client/css/style.css), [views/client/pages/home/index.pug](views/client/pages/home/index.pug))
- Tối ưu hoá controller client/api: thống kê, xu hướng, lịch sử, lọc dữ liệu, export ([controllers/client/aqi.controller.js](controllers/client/aqi.controller.js), [controllers/admin/aqi.controller.js](controllers/admin/aqi.controller.js))
- Bổ sung bản đồ quận ↔ model đầy đủ cho TP.HCM ([models/*](models), map trong controllers/scripts)
- Bổ sung header giấy phép GPL cho các file mã nguồn

### Fixed
- Sửa lỗi seed 72h không đồng bộ thời gian và phạm vi AQI ([scripts/seed-72h-data.js](scripts/seed-72h-data.js))
- Sửa phân loại nhãn AQI hiển thị chưa thống nhất (client/forecast/script)
- Khắc phục chồng lấn cron và trạng thái đang chạy khi gọi API hoặc fetch dữ liệu ([controllers/api/prediction.controller.js](controllers/api/prediction.controller.js), [scripts/fetch-openaq-hours.js](scripts/fetch-openaq-hours.js))
- Sửa một số lỗi giao diện và hiển thị thời gian cập nhật (client/admin)

---

Release Links:
- Guide: [RELEASE_GUIDE.md](RELEASE_GUIDE.md)
- How to contribute: [CONTRIBUTING.md](CONTRIBUTING.md)
- License: [LICENSE](LICENSE)