const Account = require('../../models/account.model');
const md5 = require('md5');

// [GET] /admin/auth/login
module.exports.login = (req, res) => {
    // Nếu đã đăng nhập, redirect về dashboard
    if (req.session.adminUser) {
        return res.redirect(req.app.locals.prefixAdmin + '/dashboard');
    }
    
    res.render('admin/pages/auth/login', {
        title: 'Đăng nhập Admin'
    });
};

// [POST] /admin/auth/login
module.exports.loginPost = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            req.flash('error', 'Vui lòng nhập đầy đủ email và mật khẩu!');
            return res.redirect(req.app.locals.prefixAdmin + '/auth/login');
        }

        // Tìm account
        const account = await Account.findOne({
            email: email,
            deleted: false
        }).lean();

        if (!account) {
            req.flash('error', 'Email không tồn tại!');
            return res.redirect(req.app.locals.prefixAdmin + '/auth/login');
        }

        // Kiểm tra mật khẩu
        if (account.password !== md5(password)) {
            req.flash('error', 'Mật khẩu không đúng!');
            return res.redirect(req.app.locals.prefixAdmin + '/auth/login');
        }

        // Kiểm tra trạng thái
        if (account.status !== 'active') {
            req.flash('error', 'Tài khoản đã bị khóa!');
            return res.redirect(req.app.locals.prefixAdmin + '/auth/login');
        }

        // Lưu vào session
        req.session.adminUser = {
            _id: account._id,
            fullName: account.fullName,
            email: account.email,
            role: account.role,
            token: account.token
        };

        req.flash('success', 'Đăng nhập thành công!');
        return res.redirect(req.app.locals.prefixAdmin + '/dashboard');

    } catch (error) {
        console.error('Admin login error:', error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        return res.redirect(req.app.locals.prefixAdmin + '/auth/login');
    }
};

// [GET] /admin/auth/logout
module.exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect(req.app.locals.prefixAdmin + '/auth/login');
    });
};