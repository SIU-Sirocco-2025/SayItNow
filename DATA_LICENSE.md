# DATA LICENSE – Open Data for Eco-Track

Các bộ dữ liệu được cung cấp bởi Eco-Track (qua API thường và NGSI-LD) được cấp phép theo:

- Open Data Commons Attribution License (ODC‑BY) v1.0
  - https://opendatacommons.org/licenses/by/1-0/

Bạn được phép sao chép, sử dụng, phân phối, sửa đổi và xây dựng dựa trên dữ liệu với điều kiện ghi công nguồn dữ liệu theo mục “Ghi công bắt buộc”.

Lưu ý: Giấy phép này áp dụng cho DỮ LIỆU. Phần mềm thuộc GPL‑3.0, xem [LICENSE](LICENSE).

**Ghi chú về giấy phép upstream (nguồn gốc)**  

Dữ liệu gốc từ OpenAQ, OpenStreetMap (OSM) và các nguồn mở khác **vẫn chịu giấy phép riêng của từng dự án** (upstream licenses). Eco‑Track chỉ thu thập, chuẩn hóa và tái tổ chức dữ liệu dưới dạng NGSI‑LD/REST để dễ sử dụng hơn; việc này **không thay đổi** giấy phép gốc của dữ liệu.  

Khi sử dụng lại dữ liệu, ngoài việc ghi công Eco‑Track theo ODC‑BY 1.0, bạn phải **tuân thủ đầy đủ yêu cầu ghi công và các điều khoản** của từng nhà cung cấp upstream (ví dụ: OpenAQ, OSM/ODbL, v.v.), như được tóm tắt ở mục 3 và trên trang giấy phép/chính sách của họ.



## 1) Phạm vi dữ liệu áp dụng

Giấy phép ODC‑BY áp dụng cho dữ liệu do hệ thống Eco‑Track xử lý/xuất bản một cách công khai, bao gồm:

- Dữ liệu NGSI‑LD (AirQualityObserved, AQIPrediction):
  - GET `/api/ngsi-ld/context`
    - Triển khai: [controllers/api/aqiNgsiLd.controller.js](controllers/api/aqiNgsiLd.controller.js) → [`getContext`](controllers/api/aqiNgsiLd.controller.js)
    - Context tĩnh: [public/context.jsonld](public/context.jsonld), cấu hình: [config/ngsi-ld-context.js](config/ngsi-ld-context.js)
  - GET `/api/ngsi-ld/entities`
    - Trả về entity mới nhất cho tất cả quận
    - Triển khai: [`controllers/api/aqiNgsiLd.controller.queryEntities`](controllers/api/aqiNgsiLd.controller.js)
  - GET `/api/ngsi-ld/entities/:district`
    - Trả về entity mới nhất theo quận (type: AirQualityObserved)
    - Triển khai: [`controllers/api/aqiNgsiLd.controller.getEntity`](controllers/api/aqiNgsiLd.controller.js)
  - GET `/api/ngsi-ld/entities/:district/temporal?timeAt=&endTimeAt=&limit=`
    - Truy vấn temporal theo khoảng thời gian
    - Triển khai: [`controllers/api/aqiNgsiLd.controller.getTemporalEntity`](controllers/api/aqiNgsiLd.controller.js)
  - GET `/api/ngsi-ld/predictions/:district`
    - Dự báo 24h (collection AQIPrediction)
    - Triển khai: [`controllers/api/prediction.controller.forecast24hNGSILD`](controllers/api/prediction.controller.js)
  - Router: [routers/api/ngsiLd.route.js](routers/api/ngsiLd.route.js), mount dưới [`/api`](routers/api/index.route.js)
  - Bộ chuyển đổi NGSI‑LD: [`helpers/ngsiLdConverter`](helpers/ngsiLdConverter.js) với `toNGSILD`, `toNGSILDArray`, `predictionToNGSILD`

  Ghi chú:
  - Nên dùng header Accept: `application/ld+json` cho các endpoint NGSI‑LD.
  - ID theo URN: `urn:ngsi-ld:AirQualityObserved:<districtKey>` và `urn:ngsi-ld:AQIPrediction:<districtKey>:<hour>`.
  - @context: động từ `/api/ngsi-ld/context` hoặc tĩnh từ [public/context.jsonld](public/context.jsonld).

- Dữ liệu dự đoán AQI (REST thông thường):
  - Tham khảo controller: [controllers/api/prediction.controller.js](controllers/api/prediction.controller.js) (sinh dữ liệu dự đoán, nguồn vào từ MongoDB và script Python [predict_from_json.py](predict_from_json.py))

- Dữ liệu REST AQI/Weather (xuất CSV/JSON, thống kê,…):
  - Các endpoint chính (yêu cầu API key cho một số endpoint), xem:
    - Router: [routers/client/aqi.route.js](routers/client/aqi.route.js)
    - Controller: [controllers/client/aqi.controller.js](controllers/client/aqi.controller.js)
    - Tài liệu UI: [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug)
  - Ví dụ endpoint:
    - GET `/aqi/export/:cityKey` (CSV/JSON)
    - GET `/aqi/history/:cityKey`
    - GET `/aqi/by-datetime/:cityKey`
    - GET `/aqi/statistics/:cityKey`
    - GET `/aqi/trend/:cityKey`
    - GET `/aqi/filter`
    - GET `/aqi/hourly-average/:cityKey`
    - GET `/aqi/latest-reading`
    - GET `/aqi/compare`

- Bản mô tả/ngữ cảnh JSON‑LD và ontology mapping phục vụ liên kết dữ liệu mở:
  - [public/context.jsonld](public/context.jsonld), [config/ngsi-ld-context.js](config/ngsi-ld-context.js), tài liệu tại [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug)

Ngoại lệ và điều kiện bổ sung liên quan đến dữ liệu nguồn mở bên thứ ba được nêu ở mục 3.


## 2) Ghi công bắt buộc (Attribution)

Khi sử dụng hoặc phân phối lại dữ liệu từ Eco‑Track, bạn BẮT BUỘC ghi công như sau (ví dụ):

> Dữ liệu được tổng hợp bởi dự án Eco‑Track – Hệ thống Theo Dõi & Dự Đoán Chất Lượng Không Khí TP.HCM  
> https://github.com/SIU-Sirocco-2025/Eco-Track  
> Cấp phép dữ liệu: ODC‑BY 1.0

Khi có dữ liệu tái sử dụng từ nguồn mở bên thứ ba (ví dụ OpenAQ, OpenStreetMap), bạn phải ghi công theo yêu cầu giấy phép của nguồn đó (xem mục 3).


## 3) Nguồn dữ liệu mở bên thứ ba và điều kiện giấy phép

Eco‑Track sử dụng và/hoặc hiển thị dữ liệu/nguồn lực từ bên thứ ba:

- OpenAQ (dữ liệu đo chất lượng không khí)
  - Website: https://openaq.org
  - Giấy phép dữ liệu: theo chính sách cấp phép của OpenAQ (vui lòng xem trang giấy phép/chính sách của OpenAQ để biết điều kiện cập nhật mới nhất). Bạn phải tuân thủ các điều khoản cấp phép gốc của OpenAQ khi tái sử dụng dữ liệu nguồn.
- OpenStreetMap (bản đồ nền/tiles và dữ liệu bản đồ)
  - © OpenStreetMap contributors
  - Giấy phép: ODbL 1.0 – https://www.openstreetmap.org/copyright
  - Ghi chú: Việc hiển thị bản đồ nền trong ứng dụng tuân theo điều khoản của nhà cung cấp tiles (OSM/nhà cung cấp bên thứ ba). Khi trích xuất hoặc phân phối dữ liệu OSM, bạn phải tuân thủ ODbL.
- FIWARE Smart Data Models / SOSA / SSN (mô hình/thuật ngữ)
  - Tuân thủ theo giấy phép của các dự án tương ứng (xem https://smartdatamodels.org và tài liệu của W3C SOSA/SSN).
  - Lưu ý: Đây là mô hình/ontology (metadata). Việc sử dụng mô hình không thay đổi giấy phép dữ liệu nội dung.

Tóm lại: dữ liệu do Eco‑Track tổng hợp/xử lý được cấp phép ODC‑BY 1.0; dữ liệu gốc từ bên thứ ba vẫn chịu sự điều chỉnh của giấy phép gốc của họ. Bạn phải đảm bảo vừa đáp ứng ODC‑BY vừa đáp ứng điều kiện của nguồn gốc dữ liệu (nếu có).


## 4) FAIR và Linked Open Data (LOD)

Eco‑Track hướng tới:
- FAIR: Findable, Accessible, Interoperable, Reusable
- Linked Open Data: sử dụng JSON‑LD, @id, @type, @context, và các chuẩn NGSI‑LD/SOSA/SSN
- ID thực thể theo NGSI‑LD URN (ví dụ `urn:ngsi-ld:AirQualityObserved:<districtKey>`) và context tại [public/context.jsonld](public/context.jsonld) / [config/ngsi-ld-context.js](config/ngsi-ld-context.js)

Khi tái sử dụng, vui lòng giữ nguyên `@context`, `@id`, `@type` để đảm bảo khả năng liên kết.


## 5) Phạm vi dữ liệu và bảo vệ thông tin

- Dữ liệu xuất bản không bao gồm dữ liệu cá nhân nhạy cảm.
- Giá trị AQI/thời tiết có thể chứa sai số, độ trễ hoặc gián đoạn; KHÔNG sử dụng cho các mục đích an toàn/sức khỏe thời gian thực đòi hỏi độ tin cậy cao.


## 6) Miễn trừ trách nhiệm

Dữ liệu được cung cấp “nguyên trạng”, không có bất kỳ bảo đảm nào (NO WARRANTY). Người dùng tự chịu trách nhiệm khi sử dụng dữ liệu. Xem thêm điều khoản miễn trừ trong [LICENSE](LICENSE) (áp dụng cho phần mềm) và các giấy phép nguồn dữ liệu ở mục 3.


## 7) Phiên bản và nguồn gốc (provenance)

- Phiên bản dữ liệu gắn với phiên bản phần mềm phát hành/tags: xem [CHANGELOG.md](CHANGELOG.md) và các GitHub Releases.
- Một số thực thể/collection có trường metadata về giấy phép và nguồn (ví dụ mô hình OpenAQ hours/index chứa trường `licenses`): xem [models/hcmcAirindex.model.js](models/hcmcAirindex.model.js).
- Bộ chuyển đổi đảm bảo ánh xạ thuộc tính rõ ràng tới NGSI‑LD/FIWARE/SOSA/SSN: xem [`helpers/ngsiLdConverter.js`](helpers/ngsiLdConverter.js).


## 8) Liên hệ

- Báo lỗi và góp ý: https://github.com/SIU-Sirocco-2025/Eco-Track/issues
- Tài liệu API: [views/client/pages/docs/index.pug](views/client/pages/docs/index.pug)


## 9) Tóm tắt quyền và nghĩa vụ

- Bạn có thể sử dụng/tái phân phối/chỉnh sửa dữ liệu theo ODC‑BY 1.0.
- Bạn phải:
  - Ghi công Eco‑Track như ở mục 2.
  - Tuân thủ giấy phép gốc của nguồn dữ liệu bên thứ ba (mục 3).
  - Không ám chỉ sự bảo trợ hay bảo đảm từ Eco‑Track hoặc các bên cấp phép nguồn.

© 2025 Eco‑Track – Dữ liệu mở vì cộng đồng.