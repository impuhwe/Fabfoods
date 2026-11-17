import {
  MENU_REVIEW_ISSUE_STATUSES,
  MENU_REVIEW_ISSUE_STATUS_VALUES,
} from '../config/constants.js';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';
import MenuReviewIssue from '../models/MenuReviewIssue.js';
import { notFound } from '../utils/errors.js';

function uniqueIds(ids) {
  return [...new Set(ids.map(String))];
}

function sameIds(left, right) {
  const a = uniqueIds(left ?? []);
  const b = uniqueIds(right ?? []);
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export async function listReviewIssues() {
  return MenuReviewIssue.find().sort({ sourcePage: 1, item: 1, issueId: 1 });
}

export async function upsertReviewIssues(issues) {
  const now = new Date();
  const stored = [];

  for (const issue of issues) {
    const result = await MenuReviewIssue.findOneAndUpdate(
      { issueId: issue.issueId },
      {
        $set: {
          sourcePdf: issue.sourcePdf,
          sourcePage: issue.sourcePage,
          item: issue.item,
          issue: issue.issue,
          handling: issue.handling,
          affectedSlugs: issue.affectedSlugs ?? [],
          affectedCategorySlugs: issue.affectedCategorySlugs ?? [],
          blocking: issue.blocking ?? true,
        },
        $setOnInsert: {
          status: MENU_REVIEW_ISSUE_STATUSES.OPEN,
          resolution: '',
          resolvedAt: null,
          resolvedBy: null,
          history: [
            {
              action: 'seeded',
              note: 'Imported from the authoritative PDF manifest',
              actor: null,
              at: now,
            },
          ],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    stored.push(result);
  }

  return stored;
}

export async function syncBlockingFlags() {
  const openIssues = await MenuReviewIssue.find({
    blocking: true,
    status: { $ne: MENU_REVIEW_ISSUE_STATUSES.RESOLVED },
  })
    .select('_id affectedSlugs affectedCategorySlugs')
    .lean();

  const slugs = new Map();
  const categorySlugs = new Map();

  for (const issue of openIssues) {
    const id = String(issue._id);
    for (const slug of issue.affectedSlugs ?? []) {
      if (!slugs.has(slug)) slugs.set(slug, []);
      slugs.get(slug).push(id);
    }
    for (const slug of issue.affectedCategorySlugs ?? []) {
      if (!categorySlugs.has(slug)) categorySlugs.set(slug, []);
      categorySlugs.get(slug).push(id);
    }
  }

  const categories = await MenuCategory.find().select('_id slug').lean();
  const categorySlugById = new Map(
    categories.map((category) => [String(category._id), category.slug]),
  );

  const items = await MenuItem.find()
    .select('_id slug category reviewIssueIds hasUnresolvedBlockingIssues')
    .lean();

  const operations = [];

  for (const item of items) {
    const categorySlug = categorySlugById.get(String(item.category));
    const ids = uniqueIds([
      ...(slugs.get(item.slug) ?? []),
      ...(categorySlug ? categorySlugs.get(categorySlug) ?? [] : []),
    ]);
    const hasIssues = ids.length > 0;

    if (
      sameIds(item.reviewIssueIds, ids) &&
      Boolean(item.hasUnresolvedBlockingIssues) === hasIssues
    ) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            reviewIssueIds: ids,
            hasUnresolvedBlockingIssues: hasIssues,
          },
        },
      },
    });
  }

  if (operations.length) {
    await MenuItem.bulkWrite(operations);
  }

  return operations.length;
}

export async function resolveReviewIssue(issueId, { status, resolution = '' }, actorId = null) {
  if (!MENU_REVIEW_ISSUE_STATUS_VALUES.includes(status)) {
    throw new Error(`Unsupported review issue status: ${status}`);
  }

  const issue = await MenuReviewIssue.findById(issueId);
  if (!issue) throw notFound('Review issue not found');

  const resolved = status === MENU_REVIEW_ISSUE_STATUSES.RESOLVED;
  issue.status = status;
  issue.resolution = resolved ? resolution : '';
  issue.resolvedAt = resolved ? new Date() : null;
  issue.resolvedBy = resolved ? actorId ?? null : null;
  issue.history.push({
    action: resolved ? 'resolved' : 'reopened',
    note: resolution,
    actor: actorId ?? null,
    at: new Date(),
  });

  await issue.save();
  await syncBlockingFlags();
  return issue;
}
