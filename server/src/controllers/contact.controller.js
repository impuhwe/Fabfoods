import { asyncHandler } from '../middleware/errorHandler.js';
import ContactMessage from '../models/ContactMessage.js';
import { sendSuccess } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create({
    ...req.body,
    source: 'website',
  });

  sendSuccess(
    res,
    {
      id: String(message._id),
      message:
        'Your message has been saved for the restaurant team. Email delivery is not connected yet.',
    },
    201,
  );
});
