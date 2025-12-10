# CHANGELOG

## [v1.1.3](https://github.com/SIU-Sirocco-2025/Eco-Track/releases/tag/v1.1.3) - 2025-12-09

> Phiên bản này tập trung nâng cấp lớp **model dự đoán AQI** (độ phủ quận, tham số LSTM và pipeline dự đoán), trong khi các bản trước (v1.1.0–v1.1.2) chủ yếu bổ sung NGSI‑LD, UI bản đồ và đồng bộ key quận/district trong API & docs.

### Added
- Bổ sung/bổ hoàn bộ tham số LSTM cho các quận/khu vực mới trong thư mục model:
  - Thêm/bổ sung file tham số model cho từng quận trong [model_params](model_params) (ví dụ [`model_params/lstm_params_district_1.json`](model_params/lstm_params_district_1.json), các file tương ứng cho district khác và city‑wide)
  - Chuẩn hoá cấu trúc JSON tham số (layer, weight, bias) để có thể tái sử dụng chung trong pipeline dự đoán Python
- Mở rộng logic đọc model trong script Python:
  - Cho phép lựa chọn model theo `districtKey`/file mapping trong [`predict_from_json.py`](predict_from_json.py)
  - Hỗ trợ load nhiều model khác nhau (theo quận) trong cùng một tiến trình phục vụ API

### Changed
- Cập nhật controller prediction để sử dụng/bọc các model mới:
  - Điều chỉnh mapping quận ↔ file tham số model trong [`controllers/api/prediction.controller.js`](controllers/api/prediction.controller.js) cho đồng bộ với 16 khu vực đã chuẩn hoá ở v1.1.2
  - Chuẩn hoá validate `district` trong request và thông báo lỗi khi quận chưa có model tương ứng
- Điều chỉnh lại pipeline runner:
  - Cập nhật helper chạy Python để truyền đúng đường dẫn model và thông số đầu vào tương ứng [`helpers/pythonRunner.js`](helpers/pythonRunner.js)
  - Giảm trùng lặp code khi gọi script dự đoán cho nhiều quận
- Cập nhật tài liệu và ví dụ để phản ánh model dự đoán mới:
  - Điều chỉnh phần mô tả model/dataset dự đoán và ví dụ response trong docs API ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug))
  - Cập nhật bảng evaluation/sample dataset cho phù hợp với độ phủ model mới ([evaluation_results.csv](evaluation_results.csv), [predict.csv](predict.csv))

### Fixed
- Xử lý tốt hơn các lỗi liên quan tới model:
  - Bổ sung kiểm tra tồn tại file tham số model, log cảnh báo rõ ràng khi thiếu hoặc sai tên file ([controllers/api/prediction.controller.js](controllers/api/prediction.controller.js), [predict_from_json.py](predict_from_json.py))
  - Sửa một số lỗi nhỏ trong quá trình parse JSON tham số LSTM cho từng quận (đảm bảo đúng kiểu và shape trước khi đưa vào model)
- Làm rõ hơn thông báo lỗi prediction trả về cho client khi model không khả dụng hoặc dữ liệu đầu vào không đủ 72h

// ...existing code...

## [v1.1.2](https://github.com/SIU-Sirocco-2025/Eco-Track/releases/tag/v1.1.2) - 2025-12-08

### Changed
- Đồng bộ lại danh sách quận/huyện giữa code và tài liệu:
  - Chuẩn hoá key quận dùng trong API (`hcmc`, `district1`, `district2`, `binhThanh`, `thuDuc`, `tanPhu`, `phuNhuan`, `binhTan`...) theo mapping trong service đồng bộ AQI ([services/aqiSyncService.js](services/aqiSyncService.js), [models/index.js](models/index.js))
  - Cập nhật bảng “Supported Districts (16 khu vực)” và ví dụ request trong docs để không còn thiếu/dư quận ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug))
  - Cập nhật ví dụ seed/prediction để dùng đúng key quận đã hỗ trợ ([scripts/seed-72h-data.js](scripts/seed-72h-data.js), [controllers/api/prediction.controller.js](controllers/api/prediction.controller.js))

### Fixed
- Sửa lỗi liên kết và nội dung trong API Docs:
  - Sửa các ví dụ curl dùng sai `cityKey`/`district` (ví dụ `quan1` → `district1`), đồng bộ với routing thật của API ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), [public/client/js/docs.js](public/client/js/docs.js))
  - Sửa lỗi định dạng markdown/link sai trong changelog và docs (ví dụ tham chiếu `HCMCAirHour` bị đóng ngoặc sai) ([CHANGELOG.md](CHANGELOG.md), [README.md](README.md))
  - Cập nhật lại sample dataset, bảng evaluation và bảng dataset forecast cho khớp với legend AQI, tên quận, và cấu trúc response hiện tại ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug))

- Sửa lỗi/thiếu sót nội dung trang giới thiệu:
  - Đồng bộ ví dụ dataset, bảng độ chính xác mô hình theo quận và phần mô tả Dataset với docs API (16 khu vực, tần suất, thông số đo lường) ([views/client/pages/home/about.pug](views/client/pages/home/about.pug), [views/client/mixins/about.pug](views/client/mixins/about.pug))
  - Cập nhật lại tên quận trong các bảng ví dụ (việt hoá đầy đủ “Bình Thạnh”, “Phú Nhuận”, “Tân Phú”, “Bình Tân”, “Thủ Đức” và tránh trộn lẫn English/Vietnamese) cho thống nhất với hệ thống API và bản đồ

## [v1.1.1](https://github.com/SIU-Sirocco-2025/Eco-Track/releases/tag/v1.1.1) - 2025-12-7

### Added
- Cụm giao diện tổng quan thành phố và khối khuyến nghị trực tiếp trên bản đồ AQI (city hero, chi tiết giờ gần nhất, overlay nhiệt AQM) hiển thị dựa trên trạm city‑wide ([views/client/pages/home/index.pug](views/client/pages/home/index.pug), [public/client/js/script.js](public/client/js/script.js))
- Popup chi tiết cho từng trạm/quận trên bản đồ: AQI US, chất ô nhiễm chính, thời tiết hiện tại, thời gian cập nhật và liên kết nhanh tới dữ liệu lịch sử 72h ([public/client/js/script.js](public/client/js/script.js))

### Changed
- Tinh chỉnh layout bản đồ AQI: statusbar, legend, badge mức AQI, nội dung khuyến nghị và hiệu ứng highlight để dễ đọc trên cả desktop/mobile; tách rõ trạm city‑wide và danh sách trạm quận ([public/client/js/script.js](public/client/js/script.js), [public/client/css/style.css](public/client/css/style.css), [views/client/pages/home/index.pug](views/client/pages/home/index.pug))
- Cập nhật ví dụ badge AQI và bảng dataset mẫu trong phần giới thiệu/dataset để đồng bộ màu sắc + ngưỡng AQI với legend trên bản đồ ([views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), [views/client/pages/home/about.pug](views/client/pages/home/about.pug), [views/client/mixins/about.pug](views/client/mixins/about.pug))

### Fixed
- Điều chỉnh lại logic sync AQI:
  - Chuẩn hoá tính AQI US tổng hợp và main pollutant giữa script đồng bộ OpenAQ thủ công và dịch vụ sync realtime
  - Giảm trùng lặp và hỗn loạn khi sync nhiều bản ghi cùng `current.pollution.ts` bằng cách dùng tập timestamp đã sync trước đó ([services/aqiSyncService.js](services/aqiSyncService.js), [scripts/sync-openaq-to-districts.js](scripts/sync-openaq-to-districts.js))
- Cải thiện script kiểm thử/quan sát dữ liệu:
  - `scripts/print-latest.js` in log gọn hơn, tập trung vào `current.pollution.ts` và `aqius`
  - `scripts/check-latest-openaq.js` bổ sung log rõ ràng về các bản ghi gần nhất trong [`HCMCAirHour`](models/hcmcAirHour.model.js](models/hcmcAirHour.model.js)) ([scripts/print-latest.js](scripts/print-latest.js), [scripts/check-latest-openaq.js](scripts/check-latest-openaq.js))
- Sửa một số lỗi hiển thị nhỏ trên bản đồ AQI: căn lề tooltip/popup, cập nhật thời gian đo mới nhất trên statusbar, đồng bộ màu badge với legend trong docs/dataset ([public/client/js/script.js](public/client/js/script.js), [public/client/css/style.css](public/client/css/style.css), [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug), [views/client/pages/home/about.pug](views/client/pages/home/about.pug))

---

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