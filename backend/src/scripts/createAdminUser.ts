import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Admin user created/updated:', adminUser);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });