const User = require('../../models/user.model');
const Otp = require('../../models/otp.model');
const generate = require('../../helpers/generate');
const sendMailHelper = require('../../helpers/sendMail');
const md5 = require('md5')
// [GET] /login
module.exports.login = (req, res) => {
  res.render('client/pages/auth/login.pug', { title: 'Đăng nhập' });
}
// [GET] /register
module.exports.register = (req, res) => {
  res.render('client/pages/auth/register.pug', { title: 'Đăng ký' });
}
// [POST] /register
module.exports.registerPost = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validate input
    if (!fullName || !email || !password || !confirmPassword) {
      req.flash('error', 'Vui lòng điền đầy đủ thông tin!');
      res.redirect(req.get('Referrer') || '/');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp!');
      return res.redirect(req.get('Referrer') || '/');
    }

    if (password.length < 6) {
      req.flash('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return res.redirect(req.get('Referrer') || '/');
    }

    if (req.body.acceptTerms !== 'on') {
      req.flash('error', 'Bạn phải đồng ý với các điều khoản dịch vụ!');
      return res.redirect(req.get('Referrer') || '/');
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email,
      deleted: false
    });

    if (existingUser) {
      req.flash('error', 'Email đã được sử dụng!');
      return res.redirect(req.get('Referrer') || '/');
    }

    // Create new user
    const newUser = new User({
      fullName: fullName,
      email: email,
      password: md5(password)
    });

    await newUser.save();

    req.flash('success', 'Đăng ký tài khoản thành công!');
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Register error:', error);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
    res.redirect(req.get('Referrer') || '/');
  }
}

// [POST] /login
module.exports.loginPost = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      req.flash('error', 'Vui lòng nhập email và mật khẩu!');
      return res.redirect(req.get('Referrer') || '/auth/login');
    }

    const user = await User.findOne({
      email: email,
      deleted: false
    }).lean();

    if (!user) {
      req.flash('error', 'Email không tồn tại hoặc đã bị khóa!');
      return res.redirect(req.get('Referrer') || '/auth/login');
    }

    if (user.password !== md5(password)) {
      req.flash('error', 'Mật khẩu không đúng!');
      return res.redirect(req.get('Referrer') || '/auth/login');
    }

    // (Tuỳ chọn) kiểm tra trạng thái nếu có trường status
    if (user.status && user.status !== 'active') {
      req.flash('error', 'Tài khoản chưa được kích hoạt!');
      return res.redirect(req.get('Referrer') || '/auth/login');
    }

    // Lưu thông tin cơ bản vào session
    req.session.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email
    };

    // Remember -> kéo dài phiên
    if (remember === 'on') {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 ngày
    }

    req.flash('success', 'Đăng nhập thành công!');
    return res.redirect('/'); // điều hướng sau đăng nhập

  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
    return res.redirect(req.get('Referrer') || '/auth/login');
  }
}

// [GET] /logout
module.exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

module.exports.settings = async (req, res) => {
  if (!req.session?.user?._id) {
    req.flash('error', 'Bạn cần đăng nhập!');
    return res.redirect('/auth/login');
  }
  try {
    const user = await User.findById(req.session.user._id)
      .select('fullName email apiKey')
      .lean();

    if (!user) {
      req.flash('error', 'Tài khoản không tồn tại!');
      return res.redirect('/auth/login');
    }

    // Render với dữ liệu mới nhất (ghi đè currentUser nếu middleware có set cũ)
    return res.render('client/pages/auth/settings.pug', {
      title: 'Cài đặt tài khoản',
      currentUser: user
    });
  } catch (err) {
    console.error('Settings error:', err.message);
    req.flash('error', 'Không tải được thông tin tài khoản!');
    return res.redirect('/');
  }
};

// [POST] /auth/settings/profile
module.exports.updateProfile = async (req, res) => {
  if (!req.session?.user?._id) {
    req.flash('error', 'Bạn cần đăng nhập!');
    return res.redirect('/auth/login');
  }
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
      req.flash('error', 'Thiếu họ tên hoặc email!');
      return res.redirect('/auth/settings');
    }

    // Email đã dùng bởi user khác?
    const exists = await User.findOne({
      _id: { $ne: req.session.user._id },
      email,
      deleted: false
    }).lean();
    if (exists) {
      req.flash('error', 'Email đã được sử dụng bởi tài khoản khác!');
      return res.redirect('/auth/settings');
    }

    const updated = await User.findByIdAndUpdate(
      req.session.user._id,
      { fullName, email },
      { new: true }
    ).lean();

    if (!updated) {
      req.flash('error', 'Không tìm thấy tài khoản!');
      return res.redirect('/auth/settings');
    }

    // Cập nhật lại session
    req.session.user.fullName = updated.fullName;
    req.session.user.email = updated.email;

    req.flash('success', 'Cập nhật thông tin thành công!');
    return res.redirect('/auth/settings');
  } catch (e) {
    console.error('Update profile error:', e);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật!');
    return res.redirect('/auth/settings');
  }
};

// [POST] /auth/settings/password
module.exports.updatePassword = async (req, res) => {
  if (!req.session?.user?._id) {
    req.flash('error', 'Bạn cần đăng nhập!');
    return res.redirect('/auth/login');
  }
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'Vui lòng nhập đầy đủ các trường mật khẩu!');
      return res.redirect('/auth/settings');
    }
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Xác nhận mật khẩu mới không khớp!');
      return res.redirect('/auth/settings');
    }
    if (newPassword.length < 6) {
      req.flash('error', 'Mật khẩu mới phải >= 6 ký tự!');
      return res.redirect('/auth/settings');
    }

    const user = await User.findById(req.session.user._id).lean();
    if (!user) {
      req.flash('error', 'Không tìm thấy tài khoản!');
      return res.redirect('/auth/settings');
    }
    if (user.password !== md5(currentPassword)) {
      req.flash('error', 'Mật khẩu hiện tại không đúng!');
      return res.redirect('/auth/settings');
    }

    await User.findByIdAndUpdate(user._id, { password: md5(newPassword) });
    req.flash('success', 'Đổi mật khẩu thành công!');
    return res.redirect('/auth/settings');
  } catch (e) {
    console.error('Update password error:', e);
    req.flash('error', 'Có lỗi xảy ra khi đổi mật khẩu!');
    return res.redirect('/auth/settings');
  }
};

// [GET] /auth/forgot-password
module.exports.forgotPassword = (req, res) => {
  res.render('client/pages/auth/forgot-password.pug', { title: 'Quên mật khẩu' });
}

// [POST] /auth/forgot-password
module.exports.forgotPasswordPost = async (req, res) => {
  const isJson = req.is('application/json') || (req.headers['content-type'] || '').includes('application/json');
  try {
    const { email } = req.body;
    if (!email) {
      if (isJson) return res.status(400).json({ success: false, message: 'Thiếu email' });
      req.flash('error', 'Thiếu email!');
      return res.redirect(req.get('Referrer') || '/auth/forgot-password');
    }
    const user = await User.findOne({ email, deleted: false }).lean();
    if (!user) {
      if (isJson) return res.status(404).json({ success: false, message: 'Email không tồn tại hoặc đã bị khóa' });
      req.flash('error', 'Email không tồn tại hoặc đã bị khóa!');
      return res.redirect(req.get('Referrer') || '/auth/forgot-password');
    }

    await Otp.deleteOne({ email }).catch(() => { });

    const otp = generate.generaterandomNumber(6);
    await new Otp({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    }).save();

    const subject = 'Yêu cầu đặt lại mật khẩu - Eco-Track';
    const greetingName = user?.fullName ? ` ${user.fullName}` : '';
    const html = `
    <!doctype html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Eco-Track - Xác nhận OTP</title>
    </head>
    <body style="margin:0;padding:0;background:#f3faf6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3faf6;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 24px;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <img src="https://raw.githubusercontent.com/SIU-Sirocco-2025/Eco-Track/refs/heads/main/public/client/image/logo.png" alt="Eco-Track Logo" style="width:72px;height:72px;border-radius:50%;background:#e8f7ee;border:3px solid #2ecc71;object-fit:cover;display:inline-block;" />
                  <h1 style="margin:16px 0 4px;font-size:22px;font-weight:600;color:#222;">Eco-Track</h1>
                  <p style="margin:0;font-size:14px;color:#6c757d;">Yêu cầu đặt lại mật khẩu</p>
                </td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#343a40;line-height:1.6;">
                  <p style="margin:0 0 12px;">Xin chào${greetingName},</p>
                  <p style="margin:0 0 16px;">
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản sử dụng email
                    <strong>${email}</strong>. Vui lòng sử dụng mã OTP bên dưới để xác nhận.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:20px 0 24px;">
                  <div style="display:inline-block;padding:14px 28px;border-radius:999px;border:1px dashed #2ecc71;background:#e8f7ee;color:#27ae60;font-size:28px;font-weight:700;letter-spacing:6px;">
                    ${otp}
                  </div>
                  <p style="margin:16px 0 0;font-size:13px;color:#6c757d;">
                    Mã có hiệu lực trong <strong>5 phút</strong>.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#6c757d;line-height:1.6;">
                  <p style="margin:0 0 12px;">
                    Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email và đảm bảo
                    không chia sẻ mã OTP cho bất kỳ ai.
                  </p>
                  <p style="margin:0;">
                    Trân trọng,<br>
                    <strong>Đội ngũ Eco-Track</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;border-top:1px solid #f1f3f5;font-size:11px;color:#adb5bd;text-align:center;">
                  <p style="margin:0;">
                    Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu trên website Eco-Track.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
    await sendMailHelper.sendMail(email, subject, html);

    if (isJson) return res.json({ success: true, message: 'Đã gửi OTP', email });

    return res.redirect(`/auth/otp?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('Forgot password error:', err);
    if (isJson) return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
    return res.redirect(req.get('Referrer') || '/auth/forgot-password');
  }
};

// [POST] /auth/otp (Xác minh OTP + đổi mật khẩu)
module.exports.verifyOtpAndReset = async (req, res) => {
  const isJson = req.is('application/json') || (req.headers['content-type'] || '').includes('application/json');
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      const msg = 'Thiếu email, OTP hoặc mật khẩu mới';
      return isJson
        ? res.status(400).json({ success: false, message: msg })
        : res.redirect('/auth/forgot-password');
    }
    if (password.length < 6) {
      const msg = 'Mật khẩu mới phải >= 6 ký tự';
      return isJson
        ? res.status(400).json({ success: false, message: msg })
        : res.redirect('/auth/forgot-password');
    }

    const otpDoc = await Otp.findOne({ email, otp }).lean();
    if (!otpDoc) {
      const msg = 'OTP không hợp lệ';
      return isJson
        ? res.status(400).json({ success: false, message: msg })
        : res.redirect('/auth/forgot-password');
    }
    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpDoc._id }).catch(() => { });
      const msg = 'OTP đã hết hạn';
      return isJson
        ? res.status(400).json({ success: false, message: msg })
        : res.redirect('/auth/forgot-password');
    }

    const user = await User.findOne({ email, deleted: false }).lean();
    if (!user) {
      const msg = 'Tài khoản không tồn tại';
      return isJson
        ? res.status(404).json({ success: false, message: msg })
        : res.redirect('/auth/forgot-password');
    }

    await User.findByIdAndUpdate(user._id, { password: md5(password) });
    await Otp.deleteOne({ _id: otpDoc._id }).catch(() => { });

    if (isJson) return res.json({ success: true, message: 'Đổi mật khẩu thành công' });

    req.flash('success', 'Đổi mật khẩu thành công! Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  } catch (err) {
    console.error('Verify OTP error:', err);
    if (isJson) return res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
    return res.redirect('/auth/forgot-password');
  }
};

// [GET] /auth/otp (hiển thị lại form quên mật khẩu với email đã nhập để bước 2)
module.exports.otp = (req, res) => {
  const email = req.query.email || '';
  res.render('client/pages/auth/forgot-password.pug', {
    title: 'Quên mật khẩu',
    prefillEmail: email
  });
};