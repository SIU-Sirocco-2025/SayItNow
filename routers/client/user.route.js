const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/user.controller');
const { ensureAuth } = require('../../middlewares/auth.middleware');
router.get('/login', controller.login);

router.post('/login', controller.loginPost);

// Google OAuth routes
router.get('/google', controller.googleAuth);
router.get('/google/callback', controller.googleAuthCallback);


router.get('/register', controller.register);
router.post('/register/send-otp', controller.sendRegisterOTP);
router.post('/register', controller.registerPost);

router.get('/logout', controller.logout);


router.get('/settings', ensureAuth, controller.settings);
router.post('/settings/profile', ensureAuth, controller.updateProfile);
router.post('/settings/password', ensureAuth, controller.updatePassword);


// Forgot password + OTP
router.get('/forgot-password', controller.forgotPassword);
router.post('/forgot-password', controller.forgotPasswordPost);
router.get('/otp', controller.otp);
router.post('/otp', controller.verifyOtpAndReset);

module.exports = router;