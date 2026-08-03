// Jest global teardown — runs once after ALL test suites finish
// Cleanly disconnects any open handles so Jest exits without the
// "worker process failed to exit gracefully" warning.

const path = require('path');

module.exports = async function globalTeardown() {
  try {
    // Disconnect Prisma client if it was initialised
    const dbPath = path.resolve(__dirname, 'src/config/db.ts');
    const { default: prisma } = require(dbPath);
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  } catch {
    // Prisma may be mocked — silently ignore
  }
};
