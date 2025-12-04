# DEPENDENCIES & LICENSES

Tài liệu này liệt kê các thư viện/phụ thuộc chính mà **Eco-Track** sử dụng, kèm theo **phiên bản**, **giấy phép** và **trang chủ**.  
Danh sách được nhóm theo môi trường:

- Node.js / NPM (backend, scripts, tooling)
- Python / pip (mô-đun dự đoán AQI 24h)
- Frontend (CDN: Bootstrap, Leaflet, Chart.js, Font Awesome, Highlight.js, Google Fonts)

> Lưu ý: Phiên bản dưới đây nên được đồng bộ với [`package.json`](package.json) và [`requirements.txt`](requirements.txt).  
> Luôn kiểm tra lại license tại trang chủ hoặc repository chính thức của từng thư viện.

---

## 1. Node.js / NPM Dependencies

Xem thêm cấu hình đầy đủ trong [`package.json`](package.json).

| Tên gói | Phiên bản (ví dụ) | Giấy phép | Trang chủ / Repo |
|--------|--------------------|-----------|-------------------|
| express | ^4.x | MIT | https://expressjs.com/ |
| mongoose | ^7.x | MIT | https://mongoosejs.com/ |
| dotenv | ^16.x | BSD-2-Clause | https://github.com/motdotla/dotenv |
| cors | ^2.x | MIT | https://github.com/expressjs/cors |
| morgan | ^1.x | MIT | https://github.com/expressjs/morgan |
| cookie-parser | ^1.x | MIT | https://github.com/expressjs/cookie-parser |
| express-session | ^1.x | MIT | https://github.com/expressjs/session |
| connect-mongo | ^5.x | MIT | https://github.com/jdesboeufs/connect-mongo |
| passport | ^0.6.x | MIT | http://www.passportjs.org/ |
| passport-google-oauth20 | ^2.x | MIT | https://github.com/jaredhanson/passport-google-oauth2 |
| pug | ^3.x | MIT | https://pugjs.org/ |
| node-cron | ^3.x | MIT | https://github.com/node-cron/node-cron |
| axios | ^1.x | MIT | https://github.com/axios/axios |
| json2csv | ^6.x | MIT | https://github.com/zemirco/json2csv |
| fs-extra | ^11.x | MIT | https://github.com/jprichardson/node-fs-extra |
| md5 | ^2.x | BSD-3-Clause | https://github.com/pvorb/node-md5 |
| nodemailer | ^6.x | MIT | https://nodemailer.com/ |
| winston / winston-daily-rotate-file *(nếu sử dụng)* | ^3.x | MIT | https://github.com/winstonjs/winston |

> **Ghi chú:**  
> - Tất cả các gói trên đều là **nguồn mở**, được cài đặt qua **npm**.  
> - Eco-Track **không chỉnh sửa trực tiếp** mã nguồn của các dependency này trong repo.  
> - Bất kỳ thay đổi nào (nếu cần) sẽ được thực hiện thông qua fork riêng và được ghi rõ trong tài liệu.

---

## 2. Python / pip Dependencies (Prediction)

Danh sách chi tiết nằm trong [`requirements.txt`](requirements.txt). Bảng dưới đây tóm tắt các thư viện chính:

| Tên gói | Phiên bản (ví dụ) | Giấy phép | Trang chủ / Repo |
|--------|--------------------|-----------|-------------------|
| numpy | ^1.26 | BSD-3-Clause | https://numpy.org/ |
| pandas | ^2.x | BSD-3-Clause | https://pandas.pydata.org/ |
| scikit-learn | ^1.5 | BSD-3-Clause | https://scikit-learn.org/ |
| torch (PyTorch) | ^2.x | BSD-3-Clause | https://pytorch.org/ |
| joblib | ^1.x | BSD-3-Clause | https://joblib.readthedocs.io/ |

> **Ghi chú:**  
> - Các thư viện ML được sử dụng để triển khai mô hình dự đoán AQI 24h trong [`predict_from_json.py`](predict_from_json.py).  
> - Việc kiểm tra/cài đặt tự động được hỗ trợ bởi [`helpers/checkPythonDeps.js`](helpers/checkPythonDeps.js).  
> - Tham khảo [`SECURITY.md`](SECURITY.md) để biết thêm khuyến nghị về việc audit dependency.

---

## 3. Frontend Libraries (CDN)

Các thư viện front-end được tải qua CDN trong các file Pug/HTML, không được bundle trực tiếp trong repo. Một số ví dụ:

| Thư viện | Phiên bản (ví dụ) | Giấy phép | Nơi sử dụng | Trang chủ / Repo |
|---------|--------------------|-----------|------------|-------------------|
| Bootstrap | 5.3.x | MIT | Layout client & admin – xem [`views/client/layouts/default.pug`](views/client/layouts/default.pug), [`views/admin/layouts/default.pug`](views/admin/layouts/default.pug) | https://getbootstrap.com/ |
| Bootstrap Icons | 1.11.x | MIT | Icon UI – client & admin layouts | https://icons.getbootstrap.com/ |
| Leaflet.js | 1.9.x | BSD-2-Clause | Bản đồ AQI, heatmap – xem [`public/client/js/script.js`](public/client/js/script.js) và Pug client | https://leafletjs.com/ |
| Chart.js | 4.4.x | MIT | Biểu đồ AQI/Weather – admin + client | https://www.chartjs.org/ |
| ApexCharts *(nếu dùng)* | 3.45.x | MIT | Biểu đồ dashboard admin – [`views/admin/layouts/default.pug`](views/admin/layouts/default.pug) | https://apexcharts.com/ |
| Font Awesome | 6.4.x | CC BY 4.0 / MIT (code) | Icon trong docs API – [`views/client/pages/docs/index.pug`](views/client/pages/docs/index.pug) | https://fontawesome.com/ |
| Highlight.js | 11.9.x | BSD-3-Clause | Highlight code block trong docs – [`views/client/pages/docs/index.pug`](views/client/pages/docs/index.pug) | https://highlightjs.org/ |
| Google Fonts (Inter) | — | SIL OFL 1.1 | Font chữ UI – [`views/client/pages/docs/index.pug`](views/client/pages/docs/index.pug) | https://fonts.google.com/specimen/Inter |

> **Lưu ý:**  
> - Các thư viện này được phân phối theo license riêng (MIT/BSD/CC BY/OFL…).  
> - Khi triển khai Eco-Track, người dùng cần tuân thủ điều kiện license của từng thư viện (attribution, phân phối lại, v.v.).

---

## 4. Open Data Sources & Tiles

Eco-Track sử dụng các nguồn dữ liệu/tiles mở sau (không phải “thư viện code” nhưng có **giấy phép riêng**):

| Nguồn | Nội dung | Giấy phép / Điều khoản | Tham chiếu |
|-------|----------|------------------------|-----------|
| OpenAQ API v3 | Dữ liệu AQI giờ của TP.HCM | Xem điều khoản tại https://docs.openaq.org/ | Thu thập & đồng bộ qua [`scripts/fetch-openaq-hours.js`](scripts/fetch-openaq-hours.js), [`services/aqiSyncService.js`](services/aqiSyncService.js), [`scripts/sync-openaq-to-districts.js`](scripts/sync-openaq-to-districts.js) |
| OpenStreetMap / Carto tiles | Bản đồ nền cho Leaflet | ODbL 1.0 (OSM data), điều khoản server tiles riêng | Sử dụng trong client map – xem [`public/client/js/script.js`](public/client/js/script.js) và Pug UI |

Chi tiết về giấy phép dữ liệu mở do Eco-Track công bố xem tại:

- [`DATA_LICENSE.md`](DATA_LICENSE.md) – **ODC-BY 1.0** cho dataset NGSI‑LD/AQI do hệ thống xuất bản.
- Phần “📊 Giấy Phép Dữ Liệu Mở” trong [`README.md`](README.md).

---

## 5. Ghi chú chung

- Mã nguồn Eco-Track được phát hành theo **GNU GPL v3.0** – xem [`LICENSE`](LICENSE).
- Thư viện/phụ thuộc bên thứ ba giữ nguyên license gốc của họ. Việc sử dụng trong Eco-Track tuân thủ điều kiện tương ứng.
- Nếu bạn thêm/thay đổi dependency:
  - Cập nhật phiên bản và license trong [`package.json`](package.json) / [`requirements.txt`](requirements.txt).
  - Cập nhật lại bảng tương ứng trong file `DEPENDENCIES_LICENSES.md` này.