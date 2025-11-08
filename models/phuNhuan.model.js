const mongoose = require('mongoose');
const buildBaseReadingSchema = require('./baseReadingSchema');

const schema = buildBaseReadingSchema();
schema.set('collection', 'phuNhuan_readings');

module.exports = mongoose.model('PhuNhuanReading', schema);
