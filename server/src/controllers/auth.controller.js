import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendNoContent, sendSuccess } from '../utils/response.js';
import { unauthenticated } from '../utils/errors.js';

export const csrf = (req, res) => {
  sendSuccess(res, { csrfToken: req.csrfToken });
};

export const register = asyncHandler(async (req, res) => {
  const { user, csrfToken } = await authService.register(req.body, req, res);
  sendSuccess(res, { user, csrfToken }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { user, csrfToken } = await authService.login(req.body, req, res);
  sendSuccess(res, { user, csrfToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, csrfToken } = await authService.refresh(req, res);
  sendSuccess(res, { user, csrfToken });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req, res);
  sendNoContent(res);
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw unauthenticated('Sign in to continue');
  sendSuccess(res, { user: req.user });
});
