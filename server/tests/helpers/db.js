import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let memoryServer;

export async function startTestDatabase() {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri('fabfoods_test'), {
    serverSelectionTimeoutMS: 30_000,
  });
  return memoryServer;
}

export async function stopTestDatabase() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  memoryServer = undefined;
}

export async function clearDatabase() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function getMongoUri() {
  return memoryServer?.getUri('fabfoods_test');
}
