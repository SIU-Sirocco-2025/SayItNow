const mongoose = require('mongoose');

module.exports = function buildBaseReadingSchema() {
  const schema = new mongoose.Schema({
    city: { type: String },
    state: { type: String },
    country: { type: String },

    location: {
      type: { type: String },          // "Point"
      coordinates: { type: [Number] }  // [lon, lat]
    },

    current: {
      pollution: {
        ts: { type: Date, index: true },
        aqius: { type: Number },
        mainus: { type: String },
        aqicn: { type: Number },
        maincn: { type: String }
      },
      weather: {
        ts: { type: Date },
        ic: { type: String },      // icon code
        hu: { type: Number },      // humidity
        pr: { type: Number },      // pressure
        tp: { type: Number },      // temperature
        wd: { type: Number },      // wind direction
        ws: { type: Number },      // wind speed
        heatIndex: { type: Number }
      }
    },

    // Lưu toàn bộ payload gốc nếu cần đối chiếu
    raw: { type: Object, select: false }
  }, {
    collection: null,  // set tại từng district model
    timestamps: false
  });

  // ĐÃ có index ở trường ts (current.pollution.ts) bằng "index: true" phía trên.
  // Tránh tạo trùng index gây cảnh báo của Mongoose.
  return schema;
};