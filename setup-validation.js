#!/usr/bin/env node

/**
 * Setup Validation Script
 * Verifies all services are running and correctly configured
 */

import http from 'http';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface ServiceCheck {
  name: string;
  url: string;
  timeout: number;
}

async function checkService(service: ServiceCheck): Promise<boolean> {
  return new Promise((resolve) => {
    const options = new URL(service.url);
    const timeout = setTimeout(() => {
      log(`  ✗ ${service.name} - Timeout`, 'red');
      resolve(false);
    }, service.timeout);

    const request = http.get(service.url, (res) => {
      clearTimeout(timeout);
      const success = res.statusCode === 200 || res.statusCode === 503;
      if (success) {
        log(`  ✓ ${service.name} - Running on ${service.url}`, 'green');
      } else {
        log(`  ✗ ${service.name} - Status ${res.statusCode}`, 'red');
      }
      resolve(success);
    });

    request.on('error', () => {
      clearTimeout(timeout);
      log(`  ✗ ${service.name} - Connection refused`, 'red');
      resolve(false);
    });
  });
}

async function validateEnvironment() {
  log('\n🔍 Validating Environment Configuration...', 'blue');

  const checks: Record<string, string> = {
    'NODE_ENV set': process.env.NODE_ENV ? '✓' : '✗',
    'PORT configured': process.env.PORT ? '✓' : '✗',
    'JWT_SECRET configured': process.env.JWT_SECRET ? '✓' : '✗',
  };

  for (const [key, status] of Object.entries(checks)) {
    const color = status === '✓' ? 'green' : 'red';
    log(`  ${status} ${key}`, color);
  }
}

async function validateServices() {
  log('\n🚀 Checking Services...', 'blue');

  const services: ServiceCheck[] = [
    {
      name: 'Backend API',
      url: 'http://localhost:8000/api/health',
      timeout: 3000,
    },
    {
      name: 'Frontend',
      url: 'http://localhost:3000',
      timeout: 3000,
    },
  ];

  const results = await Promise.all(services.map(checkService));
  return results.every((r) => r);
}

async function main() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║  🎭 MUKURTHAM MATRIMONY - Setup Validator     ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');

  await validateEnvironment();
  const servicesOk = await validateServices();

  log('\n📝 Configuration Status:', 'blue');
  if (servicesOk) {
    log('  ✓ All services are running correctly!', 'green');
    log('\n✨ Ready to start development!\n', 'green');
    process.exit(0);
  } else {
    log('  ✗ Some services are not running', 'red');
    log('\n📖 Next Steps:', 'yellow');
    log('  1. Start Docker services: docker-compose -f infrastructure/docker-compose.yml up -d', 'yellow');
    log('  2. Start backend: cd backend && npm run dev', 'yellow');
    log('  3. Start frontend: cd frontend && npm run dev\n', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  process.exit(1);
});
