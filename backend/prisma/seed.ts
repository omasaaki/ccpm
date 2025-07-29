import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample organizations and departments
  const org1 = await prisma.organization.create({
    data: {
      name: 'Tech Corp',
      description: 'Technology company specializing in software development',
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: 'Marketing Agency',
      description: 'Creative marketing and advertising agency',
    },
  });

  const dept1 = await prisma.department.create({
    data: {
      name: 'Engineering',
      description: 'Software development department',
      organizationId: org1.id,
    },
  });

  const dept2 = await prisma.department.create({
    data: {
      name: 'QA',
      description: 'Quality assurance and testing',
      organizationId: org1.id,
    },
  });

  const dept3 = await prisma.department.create({
    data: {
      name: 'Creative',
      description: 'Creative design team',
      organizationId: org2.id,
    },
  });

  console.log('✅ Created sample organizations and departments');

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'manager1@example.com',
        username: 'manager1',
        name: 'John Manager',
        password: hashedPassword,
        role: 'MANAGER',
        emailVerifiedAt: new Date(),
        organizationId: org1.id,
        departmentId: dept1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'user1',
        name: 'Alice Developer',
        password: hashedPassword,
        role: 'USER',
        emailVerifiedAt: new Date(),
        organizationId: org1.id,
        departmentId: dept1.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'user2',
        name: 'Bob Tester',
        password: hashedPassword,
        role: 'USER',
        emailVerifiedAt: new Date(),
        organizationId: org1.id,
        departmentId: dept2.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user3@example.com',
        username: 'user3',
        name: 'Carol Designer',
        password: hashedPassword,
        role: 'USER',
        emailVerifiedAt: new Date(),
        organizationId: org2.id,
        departmentId: dept3.id,
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
        organizationId: org1.id,
      },
    }),
  ]);

  console.log('✅ Created sample users');

  // Create sample project
  const sampleProject = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: 'Sample CCPM Project',
      description: 'A sample project to demonstrate CCPM functionality',
      status: 'PLANNING',
      ownerId: adminUser.id,
    },
  });

  console.log('✅ Created sample project:', sampleProject.name);

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Project Planning',
      description: 'Define project scope and requirements',
      status: 'COMPLETED',
      priority: 'HIGH',
      duration: 8,
      projectId: sampleProject.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Design Phase',
      description: 'Create system architecture and design',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      duration: 16,
      projectId: sampleProject.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Implementation',
      description: 'Develop the core functionality',
      status: 'TODO',
      priority: 'MEDIUM',
      duration: 40,
      projectId: sampleProject.id,
    },
  });

  console.log('✅ Created sample tasks');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });