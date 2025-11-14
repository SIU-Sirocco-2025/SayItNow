const homeRoute = require('./home.route');
const aqiRoute = require('./aqi.route');

module.exports = (app) => {
    app.use('/', homeRoute);
    app.use('/aqi', aqiRoute);
};
