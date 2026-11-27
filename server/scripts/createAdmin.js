import dns from 'node:dns';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcrypt';
import env from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import User from '../src/models/User.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';
import { createAdminSchema } from '../src/validators/auth.validator.js';
import { conflict } from '../src/utils/errors.js';

if (env.isDevelopment) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

export async function createAdmin({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw conflict('An account with that email already exists', 'EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  try {
    return await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: true,
      passwordChangedAt: new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw conflict('An account with that email already exists', 'EMAIL_IN_USE');
    }
    throw error;
  }
}

function fail(message) {
  console.error(`Admin bootstrap failed: ${message}`);
  process.exitCode = 1;
}

async function main() {
  if (env.isProduction && !env.ALLOW_ADMIN_BOOTSTRAP) {
    fail('set ALLOW_ADMIN_BOOTSTRAP=true to run this script in production');
    return;
  }

  const parsed = createAdminSchema.safeParse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.') || 'input');
    fail(`invalid or missing values: ${[...new Set(fields)].join(', ')}`);
    return;
  }

  await connectToDatabase();
  const user = await createAdmin(parsed.data);
  console.log(`Administrator created for ${user.email}. Sign in and change the password.`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .catch((error) => {
      fail(error instanceof Error ? error.message : 'unexpected error');
    })
    .finally(async () => {
      await disconnectFromDatabase().catch(() => {});
    });
}
