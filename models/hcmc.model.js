const mongoose = require('mongoose');
const buildBaseReadingSchema = require('./baseReadingSchema');

const schema = buildBaseReadingSchema();
schema.set('collection', 'hcmc_readings');

module.exports = mongoose.model('HCMCReading', schema);
