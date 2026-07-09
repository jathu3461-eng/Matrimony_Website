// Jest global setup file — sets environment variables before any module imports
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-abc';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars-xyz';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'mysql://root:test@localhost:3306/mukurtham_test';
process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
process.env.NODE_ENV = 'test';
