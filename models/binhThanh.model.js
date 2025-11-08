const mongoose = require('mongoose');
const buildBaseReadingSchema = require('./baseReadingSchema');

const schema = buildBaseReadingSchema();
schema.set('collection', 'binhThanh_readings');

module.exports = mongoose.model('BinhThanhReading', schema);
