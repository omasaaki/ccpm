import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 12);
  
  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'manager1@example.com',
        username: 'manager1',
        name: 'John Manager',
        password: hashedPassword,
        role: 'MANAGER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'user1',
        name: 'Alice Developer',
        password: hashedPassword,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'user2',
        name: 'Bob Tester',
        password: hashedPassword,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'user3@example.com',
        username: 'user3',
        name: 'Carol Designer',
        password: hashedPassword,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'inactive@example.com',
        username: 'inactive',
        name: 'Inactive User',
        password: hashedPassword,
        role: 'USER',
        isActive: false,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  console.log('Test users created:', users.length);
  users.forEach(user => {
    console.log(`- ${user.username} (${user.email}) - ${user.role} - Active: ${user.isActive}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });