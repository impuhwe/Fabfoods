import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as publicMenuService from '../services/publicMenu.service.js';

export const categories = asyncHandler(async (_req, res) => {
  const categoriesList = await publicMenuService.listCategories();
  sendSuccess(res, { categories: categoriesList });
});

export const items = asyncHandler(async (req, res) => {
  const { items: menuItems, meta } = await publicMenuService.listMenuItems(req.query);
  sendSuccess(res, { items: menuItems }, 200, meta);
});

export const item = asyncHandler(async (req, res) => {
  const menuItem = await publicMenuService.getMenuItemBySlug(req.params.slug);
  sendSuccess(res, { item: menuItem });
});

export const meta = asyncHandler(async (_req, res) => {
  const data = await publicMenuService.getMenuMeta();
  sendSuccess(res, data);
});
