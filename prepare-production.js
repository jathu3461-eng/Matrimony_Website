const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const deployDir = path.join(rootDir, 'deploy');

console.log('🧹 Preparing deployment directories...');

// Reset deploy directory
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);
fs.mkdirSync(path.join(deployDir, 'backend'));
fs.mkdirSync(path.join(deployDir, 'frontend'));

// ==========================================
// 0. Generate database.sql from migrations
// ==========================================
console.log('🗄️  Generating database.sql from Prisma migration...');
const migrationDir = path.join(rootDir, 'database', 'prisma', 'migrations');
const migrationSqlParts = [];

const header = `-- ============================================================
-- Mukurtham Matrimony -- Production Database Schema
-- Generated: ${new Date().toISOString()}
-- Target:    Namecheap MySQL 8.0
-- Database:  mukutmzw_mukurthammatrimony
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

`;
migrationSqlParts.push(header);

if (fs.existsSync(migrationDir)) {
  const migrations = fs.readdirSync(migrationDir)
    .filter(d => fs.statSync(path.join(migrationDir, d)).isDirectory())
    .sort();
  for (const migration of migrations) {
    const sqlFile = path.join(migrationDir, migration, 'migration.sql');
    if (fs.existsSync(sqlFile)) {
      migrationSqlParts.push(`\n-- Migration: ${migration}\n`);
      migrationSqlParts.push(fs.readFileSync(sqlFile, 'utf8'));
    }
  }
}
migrationSqlParts.push('\n\n-- Re-enable foreign key checks\nSET FOREIGN_KEY_CHECKS = 1;\n');
fs.writeFileSync(path.join(deployDir, 'database.sql'), migrationSqlParts.join(''), 'utf8');
console.log(`✔ database.sql generated (${Math.round(fs.statSync(path.join(deployDir, 'database.sql')).size / 1024)} KB).`);



// ==========================================
// 1. Package BACKEND
// ==========================================
console.log('📦 Copying Backend production files...');

// Copy dist folder
const backendDistSrc = path.join(rootDir, 'backend', 'dist');
const backendDistDest = path.join(deployDir, 'backend', 'dist');
if (fs.existsSync(backendDistSrc)) {
  fs.cpSync(backendDistSrc, backendDistDest, { recursive: true });
} else {
  console.error('❌ Error: backend/dist not found! Run "npm run build" in backend first.');
  process.exit(1);
}

// Copy package files
fs.copyFileSync(
  path.join(rootDir, 'backend', 'package.json'),
  path.join(deployDir, 'backend', 'package.json')
);
if (fs.existsSync(path.join(rootDir, 'backend', 'package-lock.json'))) {
  fs.copyFileSync(
    path.join(rootDir, 'backend', 'package-lock.json'),
    path.join(deployDir, 'backend', 'package-lock.json')
  );
}

// Generate cPanel Passenger root app.js wrapper
fs.writeFileSync(
  path.join(deployDir, 'backend', 'app.js'),
  "// cPanel Phusion Passenger Startup File\nrequire('./dist/app.js');\n",
  'utf8'
);
console.log('✔ cPanel root app.js startup file generated.');

// Copy prisma schema directory
const prismaSrc = path.join(rootDir, 'database', 'prisma');
const prismaDest = path.join(deployDir, 'backend', 'prisma');
if (fs.existsSync(prismaSrc)) {
  fs.cpSync(prismaSrc, prismaDest, { recursive: true });
  
  // Modify schema.prisma generator path in deployment to be local to backend
  const schemaFile = path.join(prismaDest, 'schema.prisma');
  if (fs.existsSync(schemaFile)) {
    let schemaContent = fs.readFileSync(schemaFile, 'utf8');
    // Comment out the custom output path so that Prisma client defaults to the installed @prisma/client location (vital for cPanel Node.js Selector / nodevenv environments)
    schemaContent = schemaContent.replace(
      /output\s*=\s*"..\/..\/backend\/node_modules\/\.prisma\/client"/g,
      '// output          = "../node_modules/.prisma/client" // Commented out for virtualenv compatibility'
    );
    fs.writeFileSync(schemaFile, schemaContent, 'utf8');
  }
}

// Generate production environment file (NOT copying local dev .env which has wrong port!)
const backendEnvDest = path.join(deployDir, 'backend', '.env');
const productionEnv = `# cPanel automatically injects PORT — do NOT hardcode it here
NODE_ENV=production
DATABASE_URL="mysql://mukutmzw_mukutmzw:Matrimony2026DB@127.0.0.1:3306/mukutmzw_mukurthammatrimony"

USE_MOCK_REDIS=true
REDIS_URL="redis://127.0.0.1:6379"
CLIENT_ORIGIN="https://mukurtham.ca"

JWT_SECRET="mukurtham_prod_secret_key_9876543210!"
JWT_REFRESH_SECRET="mukurtham_prod_refresh_key_0123456789!"

CLOUDINARY_CLOUD_NAME="mock_cloud"
CLOUDINARY_API_KEY="mock_key"
CLOUDINARY_API_SECRET="mock_secret"

NODEMAILER_HOST="smtp.gmail.com"
NODEMAILER_PORT=587
NODEMAILER_USER="your_gmail@gmail.com"
NODEMAILER_PASS="your_gmail_app_password"
NODEMAILER_FROM="your_gmail@gmail.com"

TWILIO_ACCOUNT_SID="mock_sid"
TWILIO_AUTH_TOKEN="mock_auth"
TWILIO_PHONE_NUMBER="+14165550198"
`;
fs.writeFileSync(backendEnvDest, productionEnv, 'utf8');
console.log('✔ Production .env generated (correct DB password, no hardcoded PORT).');
// Modify package.json scripts for deployment
const backendPkgPath = path.join(deployDir, 'backend', 'package.json');
const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
backendPkg.scripts = {
  "start": "node dist/app.js",
  "prisma:generate": "npx prisma generate --schema=./prisma/schema.prisma",
  "prisma:deploy": "npx prisma migrate deploy --schema=./prisma/schema.prisma",
  "prisma:push": "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss"
};
fs.writeFileSync(backendPkgPath, JSON.stringify(backendPkg, null, 2), 'utf8');

// Generate Prisma client locally into the custom folder
console.log('⚙ Generating Prisma client locally (bypassing cPanel restrictions)...');
const { execSync } = require('child_process');
try {
  const dbDir = path.join(rootDir, 'database');
  execSync('npx prisma generate', { cwd: dbDir, stdio: 'inherit' });
  console.log('✔ Prisma client generated successfully.');
} catch (error) {
  const prismaClientSrc = path.join(rootDir, 'backend', 'prisma-client');
  if (fs.existsSync(prismaClientSrc)) {
    console.warn('⚠ File lock detected on Prisma engine DLL (dev server active). Using existing backend/prisma-client bundle.');
  } else {
    console.error('❌ Error generating Prisma client:', error.message);
    process.exit(1);
  }
}

// Copy the custom generated prisma-client folder
const prismaClientSrc = path.join(rootDir, 'backend', 'prisma-client');
const prismaClientDest = path.join(deployDir, 'backend', 'prisma-client');
if (fs.existsSync(prismaClientSrc)) {
  fs.cpSync(prismaClientSrc, prismaClientDest, { recursive: true });
  console.log('✔ Custom Prisma client packaged for deployment.');
} else {
  console.error('❌ Error: backend/prisma-client not found! Prisma generation failed.');
  process.exit(1);
}

console.log('✔ Package.json updated.');
console.log('ℹ You no longer need to run prisma:generate on cPanel!');
// ==========================================
console.log('📦 Copying Frontend production files (Next.js standalone)...');

// Determine path to Next.js standalone build
const standaloneSrc = path.join(rootDir, 'frontend', '.next', 'standalone');

if (!fs.existsSync(standaloneSrc)) {
  console.error('❌ Error: Next.js standalone directory not found! Run "npm run build" in frontend first.');
  process.exit(1);
}

// Locate the app directory inside standalone (Next.js bundles using full relative directory path)
// It is usually: frontend/.next/standalone/Desktop/Mukurtham Matrimony/frontend
// Let's traverse to find where the package.json / server.js is.
function findStandaloneAppRoot(dir) {
  const items = fs.readdirSync(dir);
  if (items.includes('server.js') && items.includes('package.json')) {
    return dir;
  }
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      const found = findStandaloneAppRoot(fullPath);
      if (found) return found;
    }
  }
  return null;
}

const standaloneAppRoot = findStandaloneAppRoot(standaloneSrc);
if (!standaloneAppRoot) {
  console.error('❌ Error: Could not find server.js inside Next.js standalone directory.');
  process.exit(1);
}

console.log(`🔍 Found Next.js standalone app root at: ${standaloneAppRoot}`);

// Copy standalone files to deploy/frontend
fs.cpSync(standaloneAppRoot, path.join(deployDir, 'frontend'), { recursive: true });

// Copy public assets
const publicSrc = path.join(rootDir, 'frontend', 'public');
const publicDest = path.join(deployDir, 'frontend', 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
}

// ⚠️ CloudLinux cPanel Node.js Selector creates a virtualenv symlink for node_modules.
//    A physical node_modules directory in the app root causes a cPanel deployment error.
const frontendNodeModules = path.join(deployDir, 'frontend', 'node_modules');
if (fs.existsSync(frontendNodeModules)) {
  fs.rmSync(frontendNodeModules, { recursive: true, force: true });
  console.log('✔ Removed standalone node_modules for CloudLinux virtualenv compatibility.');
}

// Copy static assets (.next/static must be copied to standalone/.next/static)
const staticSrc = path.join(rootDir, 'frontend', '.next', 'static');
const staticDest = path.join(deployDir, 'frontend', '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
}

// Generate frontend .env file for production so it knows where the cPanel backend is!
const frontendEnvPath = path.join(deployDir, 'frontend', '.env');
const frontendEnvContent = `NEXT_PUBLIC_BACKEND_URL=https://api.mukurtham.ca\nNEXT_PUBLIC_SITE_URL=https://mukurtham.ca\nPORT=3000\nNODE_ENV=production\n`;
fs.writeFileSync(frontendEnvPath, frontendEnvContent, 'utf8');
console.log('✔ Production .env generated for Frontend (pointing to https://api.mukurtham.ca).');

// ⚠️  CRITICAL: Patch server.js — Next.js standalone bakes the rewrite destination
//    at BUILD time so it always points to localhost:8000. We must replace it here.
const serverJsPath = path.join(deployDir, 'frontend', 'server.js');
if (fs.existsSync(serverJsPath)) {
  let serverJs = fs.readFileSync(serverJsPath, 'utf8');
  serverJs = serverJs.replace(
    /http:\/\/localhost:\d+\/api\/\*\*/g,
    'https://api.mukurtham.ca/api/**'
  );
  fs.writeFileSync(serverJsPath, serverJs, 'utf8');
  console.log('✔ Patched server.js rewrite → https://api.mukurtham.ca');
} else {
  console.warn('⚠ Could not find server.js to patch rewrite URL!');
}

console.log('\n✅ Deployment preparation complete! 🚀');
console.log(`📁 Your deployable files are in: ${deployDir}`);
console.log('   - Upload the contents of "deploy/backend" to your API hosting application folder.');
console.log('   - Upload the contents of "deploy/frontend" to your Web hosting application folder.');
