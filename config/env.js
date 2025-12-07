// © 2025 SIU_Sirocco – Phát hành theo GPL-3.0
// This file is part of Eco-Track.
// Eco-Track is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License.
// Eco-Track is distributed WITHOUT ANY WARRANTY; see LICENSE for details.
// See LICENSE in the project root for full license text.

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

module.exports.validateEnv = function validateEnv() {
  // Required
  const required = [
    'PORT',
    'MONGODB_URL',
    'SESSION_SECRET'
  ];

  // Optional groups
  const optional = {
    OPENAQ: ['OPENAQ_API_BASE', 'OPENAQ_API_KEY', 'OPENAQ_FETCH_INTERVAL', 'SYNC_INTERVAL_MINUTES'],
    SMTP: ['EMAIL_USER', 'EMAIL_PASS'],
    GOOGLE_OAUTH: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'],
    ORION: ['USE_ORION']
  };

  info('Validating environment variables...');

  // Required checks
  required.forEach((key) => {
    if (!process.env[key] || String(process.env[key]).trim().length === 0) {
      warn(`Missing required env: ${key}. Using safe fallback (server continues).`);
    }
  });

  // Safe defaults (do not crash)
  if (!process.env.PORT) process.env.PORT = '3000';
  if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = 'change_this_secret';
  if (!process.env.SYNC_INTERVAL_MINUTES) process.env.SYNC_INTERVAL_MINUTES = '1';

  // MongoDB URL notice
  if (!process.env.MONGODB_URL) {
    warn('MONGODB_URL is not set. Database operations will fail. Server will still start, but features depending on DB will not work.');
  }

  // Feature notices
  // OpenAQ
  const hasOpenAQ = optional.OPENAQ.every(k => !!process.env[k]);
  if (!hasOpenAQ) {
    warn('OpenAQ settings incomplete. Cron sync features will be disabled or fail.');
  }

  // SMTP
  const hasSMTP = optional.SMTP.every(k => !!process.env[k]);
  if (!hasSMTP) {
    warn('SMTP not fully configured. OTP/email features will be disabled.');
  }

  // Google OAuth
  const hasGoogle = optional.GOOGLE_OAUTH.every(k => !!process.env[k]);
  if (!hasGoogle) {
    warn('Google OAuth not configured. Google login will be disabled.');
  }

  // Orion/NGSI-LD
  const useOrion = String(process.env.USE_ORION || 'false').toLowerCase();
  if (!['true', 'false'].includes(useOrion)) {
    warn('USE_ORION must be "true" or "false". Defaulting to "false".');
    process.env.USE_ORION = 'false';
  }

  // Callback URL sanity
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.includes('ecotrack:asia')) {
    warn('GOOGLE_CALLBACK_URL looks malformed. Example should be http://ecotrack.asia/auth/google/callback');
  }

  // Summary
  info('Environment validation completed.');
};