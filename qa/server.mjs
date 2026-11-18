import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'qa-access-secret-0123456789abcdef0123456789';
process.env.REFRESH_TOKEN_PEPPER = 'qa-refresh-pepper-0123456789abcdef0123456789';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.BCRYPT_ROUNDS = '10';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAME_SITE = 'lax';
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.LOG_LEVEL = 'error';
process.env.ALLOW_ADMIN_BOOTSTRAP = 'false';
process.env.PAYMENT_PROVIDER = 'disabled';
process.env.EMAIL_DELIVERY_ENABLED = 'false';

const qaApiPort = process.env.QA_API_PORT ?? '5000';
const clientOrigin = process.env.E2E_CLIENT_ORIGIN ?? 'http://localhost:5173';

process.env.PORT = qaApiPort;
process.env.CLIENT_ORIGIN = clientOrigin;

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('fabs_qa');

const bcrypt = await import('bcrypt');
const { connectToDatabase } = await import('../server/src/config/db.js');
const { seedMenu } = await import('../server/scripts/seedMenu.js');
const { default: MenuItem } = await import('../server/src/models/MenuItem.js');
const { default: User } = await import('../server/src/models/User.js');
const { default: RestaurantSettings } = await import('../server/src/models/RestaurantSettings.js');
const { default: app } = await import('../server/src/app.js');

await connectToDatabase();
await seedMenu({ allowUnverified: true });
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
await MenuItem.updateOne(
  { slug: 'continental-breakfast' },
  {
    $set: {
      verified: false,
      needsReview: true,
      reviewStatus: 'needs-review',
      isAvailable: false,
    },
  },
);

await User.create({
  name: 'QA Admin',
  email: 'qa-admin@example.com',
  passwordHash: await bcrypt.hash('QaAdminPass123', 10),
  role: 'admin',
});

await RestaurantSettings.create({
  singleton: 'default',
  payments: {
    enabledMethods: ['pay_at_restaurant'],
  },
});

const server = app.listen(Number(qaApiPort), () => {
  console.log(`QA API listening on http://localhost:${qaApiPort}`);
});

async function shutdown() {
  server.close(async () => {
    await mongo.stop();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
