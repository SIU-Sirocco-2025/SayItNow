const express = require('express');
const methodOverride = require('method-override')
// const bodyParser = require('body-parser')
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const moment = require('moment')
require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();
const passport = require('./config/passport'); 
// database connection
const database = require('./config/database')
database.connect();

// AQI Sync Service
const aqiSyncService = require('./services/aqiSyncService');

// Route
const clientRoutes = require('./routers/client/index.route');
const adminRoutes = require('./routers/admin/index.route');
const apiRoutes = require('./routers/api/index.route'); // Thêm dòng này
const system = require('./config/system');


// Main
const app = express();

const port = process.env.PORT || 3000;

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
// set view engine PUG
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//Flash message
app.use(cookieParser('afasdhgwerw'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret', 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}));
app.use(flash());

// Passport middleware - Thêm phần này
app.use(passport.initialize());
app.use(passport.session());

// App local variables
app.locals.moment = moment;
app.locals.prefixAdmin = system.prefixAdmin;
app.locals.prefixApi = system.prefixAPI;
// TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
// End TinyMCE

// Inject currentUser into templates
const { injectUser } = require('./middlewares/auth.middleware');
app.use(injectUser);

// Inject adminUser into admin templates
const { injectAdminUser } = require('./middlewares/admin.middleware');
app.use(injectAdminUser);

clientRoutes(app);
adminRoutes(app);
apiRoutes(app); // Thêm dòng này


// Serve static context
app.use('/context', express.static('public/context'));

app.use((req, res) => {
    res.status(404).render('client/pages/errors/404', {
        title: 'Trang không tồn tại'
    });
});

app.listen(port, async () => {
    console.log(`http://localhost:${port}`);
    
    // Khởi tạo: Sync 72h dữ liệu
    await aqiSyncService.initialSync();
    
    // Tự động sync realtime mỗi phút
    const syncInterval = parseInt(process.env.SYNC_INTERVAL_MINUTES) || 1;
    console.log(`⏰ Auto-sync enabled: Every ${syncInterval} minute(s)\n`);
    
    setInterval(async () => {
        await aqiSyncService.syncRealtimeData();
    }, syncInterval * 60 * 1000);
});
