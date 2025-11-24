module.exports.requireAuth = (req, res, next) => {
    if (!req.session?.adminUser) {
        req.flash('error', 'Vui lòng đăng nhập để tiếp tục!');
        return res.redirect(req.app.locals.prefixAdmin + '/auth/login');
    }
    
    // Inject adminUser vào res.locals để dùng trong views
    res.locals.adminUser = req.session.adminUser;
    next();
};

module.exports.injectAdminUser = (req, res, next) => {
    res.locals.adminUser = req.session?.adminUser || null;
    next();
};