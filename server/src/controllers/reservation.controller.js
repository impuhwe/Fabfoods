import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as reservationService from '../services/reservation.service.js';

export const create = asyncHandler(async (req, res) => {
  const reservation = await reservationService.createReservation(req.body, req.user);
  sendSuccess(
    res,
    {
      reservation,
      message:
        'Your table request has been received. This is not a confirmed reservation until the restaurant responds.',
    },
    201,
  );
});

export const mine = asyncHandler(async (req, res) => {
  const reservations = await reservationService.listUserReservations(req.user.id);
  sendSuccess(res, { reservations });
});

export const cancel = asyncHandler(async (req, res) => {
  const reservation = await reservationService.cancelReservation(
    req.params.reference,
    { user: req.user, email: req.body.email },
    req.body.reason,
  );
  sendSuccess(res, { reservation });
});
