/**
 * health-check.js
 * Post-deployment smoke test and health checking script.
 * Verifies that the frontend, backend, and database are healthy and responding.
 */

const http = require('http');
const https = require('https');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const targets = [
  { name: 'Frontend Shell', url: FRONTEND_URL, expectedStatus: 200 },
  { name: 'Backend Root/Health', url: `${BACKEND_URL}/api/health`, expectedStatus: 200 },
];

async function checkUrl({ name, url, expectedStatus }) {
  console.log(`[HealthCheck] Verifying ${name} via ${url}...`);
  const client = url.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    const req = client.get(url, { timeout: 10000 }, (res) => {
      console.log(`[HealthCheck] ${name} responded with status: ${res.statusCode}`);
      if (res.statusCode === expectedStatus || (expectedStatus === 200 && res.statusCode >= 200 && res.statusCode < 400)) {
        resolve({ name, success: true });
      } else {
        resolve({ name, success: false, error: `Status code mismatch: Expected ${expectedStatus}, got ${res.statusCode}` });
      }
    });

    req.on('error', (err) => {
      resolve({ name, success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ name, success: false, error: 'Connection timed out' });
    });
  });
}

async function runAllChecks() {
  console.log('=' .repeat(50));
  console.log('Starting Post-Deployment Smoke Tests...');
  console.log('=' .repeat(50));

  let overallSuccess = true;
  for (const target of targets) {
    const result = await checkUrl(target);
    if (!result.success) {
      console.error(`❌ [FAILURE] ${result.name}: ${result.error}`);
      overallSuccess = false;
    } else {
      console.log(`✅ [SUCCESS] ${result.name} is healthy!`);
    }
  }

  console.log('=' .repeat(50));
  if (overallSuccess) {
    console.log('🎉 [HealthCheck Passed] All smoke tests succeeded!');
    process.exit(0);
  } else {
    console.error('💥 [HealthCheck Failed] One or more components are unhealthy!');
    process.exit(1);
  }
}

runAllChecks();
