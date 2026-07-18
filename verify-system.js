#!/usr/bin/env node

/**
 * MUKURTHAM MATRIMONY - SYSTEM VERIFICATION SCRIPT
 * Verifies all database connections, API endpoints, and data flow
 * Dependency-Free: Uses native Node.js libraries only.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

// Test HTTP endpoint
function testHttp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

// Read database URL from backend/.env
function getDbUrlFromEnv() {
  try {
    const envPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
      if (match) return match[1];
    }
  } catch (err) {
    // Ignore error
  }
  return 'unknown';
}

// Main verification
async function verify() {
  console.log('\n' + colors.blue + '════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + '  MUKURTHAM MATRIMONY - SYSTEM VERIFICATION' + colors.reset);
  console.log(colors.blue + '════════════════════════════════════════════════════════' + colors.reset + '\n');

  const dbUrl = getDbUrlFromEnv();

  // 1. Backend API
  console.log(colors.blue + '1. Backend API & Database Status' + colors.reset);
  const backend = await testHttp('http://localhost:8000/api/health');
  if (backend.status === 200) {
    log.success('Backend API running on http://localhost:8000 (status: 200)');
    if (backend.data?.services?.database === 'connected') {
      log.success(`Database connected successfully (${dbUrl})`);
    } else {
      log.error(`Database connection issue. Status: ${backend.data?.services?.database || 'unknown'}`);
    }
    if (backend.data?.services?.redis === 'connected') {
      log.success('Redis connected successfully (Cache Layer)');
    } else {
      log.warn(`Redis is using mock/fallback mode. Status: ${backend.data?.services?.redis || 'unknown'}`);
    }
  } else if (backend.status === 503) {
    log.warn('Backend API running, but operating in degraded state (503)');
    if (backend.data?.services) {
      console.log(`   - Database: ${backend.data.services.database === 'connected' ? colors.green + 'connected' : colors.red + backend.data.services.database}${colors.reset}`);
      console.log(`   - Redis:    ${backend.data.services.redis === 'connected' ? colors.green + 'connected' : colors.yellow + backend.data.services.redis}${colors.reset}`);
    }
  } else if (backend.error) {
    log.error(`Backend API not responding: ${backend.error}`);
  } else {
    log.error(`Backend API returned status ${backend.status}`);
  }

  // 2. Frontend
  console.log('\n' + colors.blue + '2. Frontend Application' + colors.reset);
  const frontend = await testHttp('http://localhost:3000/');
  if (frontend.status === 200) {
    log.success('Frontend running on http://localhost:3000');
  } else if (frontend.error) {
    log.error(`Frontend not responding: ${frontend.error}`);
  } else {
    log.error(`Frontend returned status ${frontend.status}`);
  }

  // 3. Key API Endpoints
  console.log('\n' + colors.blue + '3. API Endpoint Mapping' + colors.reset);
  const endpoints = [
    '/api/health',
    '/api/v1/admin/dashboard/stats',
    '/api/v1/admin/users',
    '/api/v1/admin/brokers',
    '/api/v1/admin/payments',
  ];

  for (const endpoint of endpoints) {
    const result = await testHttp('http://localhost:8000' + endpoint);
    if (result.status === 200) {
      log.success(`${endpoint} - OK (Status: 200)`);
    } else if (result.status === 401) {
      log.success(`${endpoint} - Secured endpoint (Requires Auth / JWT)`);
    } else if (result.error) {
      log.error(`${endpoint} - Connect failed: ${result.error}`);
    } else {
      log.warn(`${endpoint} - Status ${result.status}`);
    }
  }

  console.log('\n' + colors.blue + '════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.green + '✓ System verification checks finished!' + colors.reset + '\n');
}

verify().catch(console.error);
