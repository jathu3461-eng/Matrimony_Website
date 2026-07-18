import { PrismaClient } from '../../prisma-client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  console.log('Seeding root administrator...');
  
  // 1. Ensure 'admin' role exists
  let adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'admin' }
    });
    console.log('Created admin role.');
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('Matrimony2026@', salt);

  // 3. Upsert admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'matrimony2026@gmail.com' },
    update: {
      password: hashedPassword,
      accountType: 'individual',
      isEmailVerified: true,
      isPhoneVerified: true,
      isApproved: true,
    },
    create: {
      username: 'SystemAdmin',
      email: 'matrimony2026@gmail.com',
      phoneNumber: '+94000000000', // Dummy phone
      password: hashedPassword,
      accountType: 'individual',
      isEmailVerified: true,
      isPhoneVerified: true,
      isApproved: true,
    }
  });

  // 4. Assign admin role
  const existingRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    }
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    console.log('Assigned admin role to user.');
  }

  console.log('Admin user seeded successfully!');
  console.log(`Email: ${adminUser.email}`);
  console.log(`ID: ${adminUser.id}`);
}

seedAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
