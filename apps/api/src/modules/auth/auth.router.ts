import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { requireAuth }      from '../../middleware/authMiddleware';
import { handleRegister, handleLogin, handleRefresh, handleMe } from './auth.controller';

import passport from './passport';
import { handleOAuthCallback } from './oauth.controller';

const router = Router();

router.post('/register', authRateLimiter, handleRegister);
router.post('/login',    authRateLimiter, handleLogin);
router.post('/refresh',  authRateLimiter, handleRefresh);
router.get ('/me',       requireAuth,     handleMe);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=OAuthFailed` }),
  handleOAuthCallback
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=OAuthFailed` }),
  handleOAuthCallback
);

export default router;
