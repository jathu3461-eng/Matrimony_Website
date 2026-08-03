/**
 * Global Redis mock for Jest.
 * Placed at src/tests/__mocks__/redis.ts and wired in via jest.config.js moduleNameMapper.
 * Prevents the real ioredis client from opening a network socket during tests.
 */
const redisMock = {
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(900),
  quit: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
  disconnect: jest.fn(),
};

export default redisMock;
