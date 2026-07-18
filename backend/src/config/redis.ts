import Redis from 'ioredis';

class MockRedis {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async setex(key: string, seconds: number, value: string) {
    this.store.set(key, { value, expiry: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string) {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string) {
    const item = await this.get(key);
    const val = (parseInt(item || '0', 10) + 1).toString();
    this.store.set(key, { value: val, expiry: this.store.get(key)?.expiry || null });
    return parseInt(val, 10);
  }

  async expire(key: string, seconds: number) {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string) {
    const item = this.store.get(key);
    if (!item || !item.expiry) return -1;
    return Math.max(0, Math.floor((item.expiry - Date.now()) / 1000));
  }

  async ping() {
    return 'PONG';
  }

  on(event: string, cb: any) {
    if (event === 'connect') {
      setTimeout(cb, 10);
    }
  }
}

const isWinLocal = process.platform === 'win32' && process.env.NODE_ENV === 'development';
const useMock = isWinLocal || process.env.USE_MOCK_REDIS === 'true';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Use In-Memory Mock Redis if specified or during local Windows development to avoid connection errors, otherwise use real Redis
const redis = useMock 
  ? (new MockRedis() as any) 
  : new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

if (!useMock) {
  redis.on('connect', () => {
    console.log('Redis client successfully connected');
  });
  redis.on('error', (err: any) => {
    console.error('Redis client error:', err);
  });
} else {
  console.log('Using Mock In-Memory Redis (either Win local dev or USE_MOCK_REDIS is true)');
}

export default redis;
