const Account = require('../../models/account.model');
const md5 = require('md5');

// [GET] /admin/settings
module.exports.index = async (req, res) => {
    try {
        const adminUser = req.session.adminUser;
        
        res.render('admin/pages/settings/index', {
            title: 'Cài đặt Admin',
            adminUser: adminUser
        });
    } catch (err) {
        res.status(500).send('Settings page error');
    }
};

// [POST] /admin/settings/change-password
module.exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const adminUser = req.session.adminUser;

        // Validate input
        if (!oldPassword || !newPassword || !confirmPassword) {
            req.flash('error', 'Vui lòng điền đầy đủ tất cả các trường!');
            return res.redirect(req.app.locals.prefixAdmin + '/settings');
        }

        // Kiểm tra mật khẩu cũ
        const account = await Account.findById(adminUser._id);
        
        if (!account) {
            req.flash('error', 'Không tìm thấy tài khoản!');
            return res.redirect(req.app.locals.prefixAdmin + '/settings');
        }

        if (account.password !== md5(oldPassword)) {
            req.flash('error', 'Mật khẩu cũ không đúng!');
            return res.redirect(req.app.locals.prefixAdmin + '/settings');
        }

        // Kiểm tra mật khẩu mới và xác nhận
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Mật khẩu mới và xác nhận không khớp!');
            return res.redirect(req.app.locals.prefixAdmin + '/settings');
        }

        // Kiểm tra độ dài mật khẩu
        if (newPassword.length < 6) {
            req.flash('error', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
            return res.redirect(req.app.locals.prefixAdmin + '/settings');
        }

        // Kiểm tra mật khẩu mới có giống mật khẩu cũ không
        if (oldPassword === newPassword) {
            req.flash('error', 'Mật khẩu mới không được giống mật khẩu cũ!');
            return res.redirect(req.app.locals.prefixAdmin + '/settings');
        }

        // Cập nhật mật khẩu
        account.password = md5(newPassword);
        await account.save();

        req.flash('success', 'Đổi mật khẩu thành công!');
        return res.redirect(req.app.locals.prefixAdmin + '/settings');

    } catch (error) {
        console.error('Change password error:', error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        return res.redirect(req.app.locals.prefixAdmin + '/settings');
    }
};
