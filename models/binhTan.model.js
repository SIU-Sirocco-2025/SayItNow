const mongoose = require('mongoose');
const buildBaseReadingSchema = require('./baseReadingSchema');

const schema = buildBaseReadingSchema();
schema.set('collection', 'binhTan_readings');

module.exports = mongoose.model('BinhTanReading', schema);