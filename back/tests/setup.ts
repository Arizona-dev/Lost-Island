import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';

let mongoServer: MongoMemoryServer;
let redisClient: Redis;

beforeAll(async () => {
  try {
    // Disconnect any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect with unique database name to avoid conflicts
    const dbName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullUri = `${mongoUri}/${dbName}`;
    await mongoose.connect(fullUri);

    // Setup Redis Memory (using a test Redis instance)
    redisClient = new Redis({ lazyConnect: true });
    await redisClient.connect();
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  try {
    // Cleanup WebSocket timers first
    const { cleanupWebSocketTimers } = await import('../src/websocket/index');
    cleanupWebSocketTimers();

    // Cleanup database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.quit();
    }
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
}, 60000);

afterEach(async () => {
  try {
    // Clear all collections after each test
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }

    // Clear Redis
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.flushall();
    }
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});
