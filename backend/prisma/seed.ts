import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ccpm.local' },
    update: {},
    create: {
      email: 'admin@ccpm.local',
      username: 'admin',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

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

  // Create task dependencies
  await prisma.task.update({
    where: { id: task2.id },
    data: {
      dependencies: {
        connect: { id: task1.id },
      },
    },
  });

  await prisma.task.update({
    where: { id: task3.id },
    data: {
      dependencies: {
        connect: { id: task2.id },
      },
    },
  });

  console.log('✅ Created sample tasks with dependencies');
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