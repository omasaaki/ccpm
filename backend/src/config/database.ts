import { PrismaClient } from '@prisma/client';

// Global prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton PrismaClient instance
const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

export { prisma };