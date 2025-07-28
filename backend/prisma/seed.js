"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
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
//# sourceMappingURL=seed.js.map