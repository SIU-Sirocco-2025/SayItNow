const dashboardRoute = require('./dashboard.route');
const aqiRoute = require('./aqi.route');
const weatherRoute = require('./weather.route');
const usersRoute = require('./users.route');
const userRoute = require('./user.route');
const authRoute = require('./auth.route')
const { requireAuth } = require('../../middlewares/admin.middleware');

module.exports = (app) => {
    const PATH_ADMIN = app.locals.prefixAdmin;
    
    // Route không cần auth
    app.use(PATH_ADMIN + '/auth', authRoute);
    
    // Áp dụng middleware cho các route cần auth
    app.use(PATH_ADMIN + '/dashboard', requireAuth, dashboardRoute);
    app.use(PATH_ADMIN + '/aqi', requireAuth, aqiRoute);
    app.use(PATH_ADMIN + '/weather', requireAuth, weatherRoute);
    app.use(PATH_ADMIN + '/users', requireAuth, usersRoute);
    app.use(PATH_ADMIN + '/user', requireAuth, userRoute);
};
