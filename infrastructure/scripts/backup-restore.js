/**
 * backup-restore.js
 * Platform-independent utility script for database backup and restore operations.
 * Reads configurations from DATABASE_URL or standard environment variables.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
const dbUrl = process.env.DATABASE_URL || 'mysql://mukurtham_user:mukurtham_password@localhost:3308/mukurtham_matrimony';

// Parse DATABASE_URL if present: mysql://user:pass@host:port/db
function parseDatabaseUrl(url) {
  try {
    const pattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const matches = url.match(pattern);
    if (matches) {
      let database = matches[5];
      if (database.includes('?')) {
        database = database.split('?')[0];
      }
      return {
        user: matches[1],
        password: matches[2],
        host: matches[3],
        port: matches[4],
        database: database,
      };
    }
  } catch (e) {
    console.error('Failed parsing DATABASE_URL, falling back to env/defaults.');
  }
  return {
    user: process.env.DB_USER || 'mukurtham_user',
    password: process.env.DB_PASSWORD || 'mukurtham_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    database: process.env.DB_NAME || 'mukurtham_matrimony',
  };
}

const config = parseDatabaseUrl(dbUrl);
const backupDir = path.join(__dirname, '../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const action = process.argv[2]; // 'backup' or 'restore'
const targetFile = process.argv[3]; // specific file for restore

if (action === 'backup') {
  performBackup();
} else if (action === 'restore') {
  if (!targetFile) {
    console.error('Error: Please specify the file name/path to restore from.');
    process.exit(1);
  }
  performRestore(targetFile);
} else {
  console.log('Usage: node backup-restore.js [backup|restore] [filename]');
  process.exit(0);
}

function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${config.database}-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  console.log(`[Backup] Initializing backup for database: "${config.database}"...`);
  
  // Construct mysqldump command
  // Note: -h, -u, -p, -P flags
  const cmd = `mysqldump -h ${config.host} -P ${config.port} -u ${config.user} -p"${config.password}" --databases ${config.database} > "${filepath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Backup Error] Failed to generate backup: ${error.message}`);
      process.exit(1);
    }
    console.log(`[Backup Success] Backup saved successfully to: ${filepath}`);
  });
}

function performRestore(file) {
  let filepath = file;
  if (!path.isAbsolute(file)) {
    filepath = path.join(backupDir, file);
  }

  if (!fs.existsSync(filepath)) {
    console.error(`[Restore Error] File not found: ${filepath}`);
    process.exit(1);
  }

  console.log(`[Restore] Initializing restore from: "${filepath}" into database "${config.database}"...`);

  // Construct mysql import command
  const cmd = `mysql -h ${config.host} -P ${config.port} -u ${config.user} -p"${config.password}" ${config.database} < "${filepath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Restore Error] Failed to import database: ${error.message}`);
      process.exit(1);
    }
    console.log('[Restore Success] Database restored successfully!');
  });
}
