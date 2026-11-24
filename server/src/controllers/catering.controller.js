import { asyncHandler } from '../middleware/errorHandler.js';
import CateringRequest from '../models/CateringRequest.js';
import { sendSuccess } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const request = await CateringRequest.create({
    ...req.body,
    source: 'website',
  });

  sendSuccess(
    res,
    {
      id: String(request._id),
      message:
        'Your catering request has been saved for the restaurant team. Email delivery is not connected yet.',
    },
    201,
  );
});

export const list = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    CateringRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CateringRequest.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  sendSuccess(res, requests, 200, {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  });
});
