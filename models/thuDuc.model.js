const mongoose = require('mongoose');
const buildBaseReadingSchema = require('./baseReadingSchema');

const schema = buildBaseReadingSchema();
schema.set('collection', 'thuDuc_readings');

module.exports = mongoose.model('ThuDucReading', schema);
