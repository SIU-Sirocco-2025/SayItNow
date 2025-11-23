const homeRoute = require('./home.route');
const aqiRoute = require('./aqi.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');

module.exports = (app) => {
    app.use('/', homeRoute);
    app.use('/aqi', aqiRoute);
    app.use('/auth', userRoute);
    app.use('/api/docs', docsRoute);
};
