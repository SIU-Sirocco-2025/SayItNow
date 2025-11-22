module.exports.injectUser = (req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
};

module.exports.ensureAuth = (req, res, next) => {
  if (!req.session?.user) {
    req.flash('error', 'Vui lòng đăng nhập trước!');
    return res.redirect('/auth/login');
  }
  next();
};