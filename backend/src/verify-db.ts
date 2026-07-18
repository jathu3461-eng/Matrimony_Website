import prisma from './config/db';

async function testDatabaseConnection() {
  console.log('\n🔍 Testing MySQL Connection via Prisma...\n');

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to MySQL via Prisma\n');

    // Check users table
    const userCount = await prisma.user.count();
    console.log(`📊 Total Users: ${userCount}`);

    // Check profiles table
    const profileCount = await prisma.profile.count();
    console.log(`📊 Total Profiles: ${profileCount}`);

    // Check broker profiles
    const brokerCount = await prisma.brokerProfile.count();
    console.log(`📊 Total Broker Profiles: ${brokerCount}`);

    // Check photos
    const photoCount = await prisma.photo.count();
    console.log(`📊 Total Photos: ${photoCount}`);

    // Check payments
    const paymentCount = await prisma.payment.count();
    console.log(`📊 Total Payments: ${paymentCount}`);

    // Check memberships
    const membershipCount = await prisma.userMembership.count();
    console.log(`📊 Total Memberships: ${membershipCount}`);

    console.log('\n✅ All database tables are accessible!\n');

    // Test insertion
    console.log('📝 Testing data insertion...');
    try {
      const testUser = await prisma.user.create({
        data: {
          email: `test_${Date.now()}@example.com`,
          username: `testuser_${Date.now()}`,
          password: 'hashed_test_password',
          phoneNumber: '+1234567890',
          accountType: 'individual',
        },
      });
      console.log(`   ✅ Created test user with ID: ${testUser.id}`);

      // Clean up
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('   ✅ Deleted test user');
    } catch (error: any) {
      console.log(`   ⚠️  Test insertion: ${error.message}`);
    }

    console.log('\n✅ Database connection verification complete!\n');
  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
