require('dotenv').config();
const { PrismaClient } = require('./prisma-client');
const p = new PrismaClient();

async function main() {
  try {
    const result = await p.$executeRaw`SELECT 1`;
    console.log('DB CONNECTED OK, result:', result);
  } catch (e) {
    console.error('DB CONNECTION FAILED:', e.message);
    console.error('Code:', e.code);
  } finally {
    await p.$disconnect();
    process.exit(0);
  }
}

main();
