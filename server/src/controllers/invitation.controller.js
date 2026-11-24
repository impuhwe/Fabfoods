import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as invitationService from '../services/invitation.service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await invitationService.listInvitations(req.query, req);
  sendSuccess(res, result.invitations, 200, result.meta);
});

export const create = asyncHandler(async (req, res) => {
  const { invitation, emailSent, emailError } = await invitationService.createInvitation(
    req.body,
    req.user,
    req,
  );
  sendSuccess(res, { invitation, emailSent, emailError }, 201);
});

export const revoke = asyncHandler(async (req, res) => {
  const invitation = await invitationService.revokeInvitation(
    req.params.id,
    req.body,
    req.user,
    req,
  );
  sendSuccess(res, { invitation });
});

export const accept = asyncHandler(async (req, res) => {
  const result = await invitationService.acceptInvitation(req.body, req);
  sendSuccess(res, result);
});
