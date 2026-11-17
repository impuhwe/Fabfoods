import MenuItem from '../../src/models/MenuItem.js';

export async function publishSeededMenu() {
  await MenuItem.updateMany(
    {},
    {
      $set: {
        verified: true,
        needsReview: false,
        reviewStatus: 'verified',
        isAvailable: true,
        hasUnresolvedBlockingIssues: false,
      },
    },
  );
}
