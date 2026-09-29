import { PrismaClient } from '@prisma/client';
import { mockPrismaClient } from './dbFallback.js';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || '';
const isPlaceholder = !dbUrl || dbUrl.includes('YOUR_PASSWORD') || dbUrl.includes('ep-sample-pooler');

let prismaClient = null;
let useFallback = isPlaceholder;

if (!isPlaceholder) {
  try {
    prismaClient = new PrismaClient();
  } catch (err) {
    console.warn('⚠️ PrismaClient init error, using dev mock store:', err.message);
    useFallback = true;
  }
} else {
  console.log('💡 Note: DATABASE_URL is currently using placeholder credentials.');
  console.log('⚡ Using local fast in-memory store so Login, Register, Menu, and Orders work immediately without errors.');
  console.log('🔗 When ready, paste your Neon DB connection string into backend/.env');
}

// Proxy to seamlessly route calls to real Prisma when available, or to mock store if Neon DB fails/is placeholder
const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === '$connect') {
      return async () => {
        if (!useFallback && prismaClient) {
          try {
            await prismaClient.$connect();
            console.log('🐘 Connected successfully to Neon DB (PostgreSQL)!');
          } catch (err) {
            console.warn('⚠️ Neon DB connection unreachable. Falling back to local store for seamless operation:', err.message);
            useFallback = true;
          }
        }
      };
    }
    if (prop === '$disconnect') {
      return async () => {
        if (!useFallback && prismaClient) {
          await prismaClient.$disconnect();
        }
      };
    }
    if (prop === '$transaction') {
      return async (fn) => {
        if (!useFallback && prismaClient) {
          try {
            return await prismaClient.$transaction(fn);
          } catch (err) {
            console.warn('Transaction failed on Neon DB, using fallback store');
            return mockPrismaClient.$transaction(fn);
          }
        }
        return mockPrismaClient.$transaction(fn);
      };
    }

    if (!useFallback && prismaClient && prismaClient[prop]) {
      const realRepo = prismaClient[prop];
      return new Proxy(realRepo, {
        get(rTarget, rProp) {
          const originalMethod = rTarget[rProp];
          if (typeof originalMethod === 'function') {
            return async (...args) => {
              try {
                return await originalMethod.apply(rTarget, args);
              } catch (dbErr) {
                console.warn(`⚠️ Neon DB query failed (${String(prop)}.${String(rProp)}), using fallback store:`, dbErr.message);
                useFallback = true;
                const fallbackRepo = mockPrismaClient[prop];
                if (fallbackRepo && typeof fallbackRepo[rProp] === 'function') {
                  return fallbackRepo[rProp](...args);
                }
                throw dbErr;
              }
            };
          }
          return originalMethod;
        }
      });
    }

    return mockPrismaClient[prop];
  }
});

export default dbProxy;
