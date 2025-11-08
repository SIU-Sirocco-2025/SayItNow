const mongoose = require('mongoose');
const buildBaseReadingSchema = require('./baseReadingSchema');

const schema = buildBaseReadingSchema();
schema.set('collection', 'tanPhu_readings');

module.exports = mongoose.model('TanPhuReading', schema);
