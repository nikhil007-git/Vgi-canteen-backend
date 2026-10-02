// In-Memory Sliding Window Rate Limiter
// Provides DOS/brute-force defense without external dependencies

class MemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.max = options.max || 100; // Max requests per window
    this.message = options.message || 'Too many requests from this IP, please try again later.';
    this.keyPrefix = options.keyPrefix || 'rl:';
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.hits = new Map();

    // Periodically prune stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  getClientKey(req) {
    // Extract real client IP taking into account reverse proxies if trusted
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : (req.socket?.remoteAddress || req.ip || '127.0.0.1');
    return `${this.keyPrefix}${ip}`;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (now - record.resetTime > 0) {
        this.hits.delete(key);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getClientKey(req);
      const now = Date.now();

      let record = this.hits.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs
        };
        this.hits.set(key, record);
      } else {
        record.count += 1;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      // Set standard rate limit headers
      res.setHeader('RateLimit-Limit', this.max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      if (record.count > this.max) {
        res.setHeader('Retry-After', resetSeconds);
        console.warn(`[Security Alert] Rate limit exceeded for IP: ${key} on ${req.method} ${req.originalUrl}`);
        return res.status(429).json({
          success: false,
          message: this.message,
          retryAfterSeconds: resetSeconds
        });
      }

      next();
    };
  }
}

// Configurable limiters
const authMax = parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 15;
const uploadMax = parseInt(process.env.RATE_LIMIT_UPLOAD_MAX, 10) || 25;
const pickupMax = parseInt(process.env.RATE_LIMIT_PICKUP_MAX, 10) || 30;
const couponMax = parseInt(process.env.RATE_LIMIT_COUPON_MAX, 10) || 25;
const globalMax = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) || 400;

export const authLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: authMax,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  keyPrefix: 'auth:'
}).middleware();

export const uploadLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: uploadMax,
  message: 'File upload rate limit reached. Please wait before uploading more images.',
  keyPrefix: 'upload:'
}).middleware();

export const pickupLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: pickupMax,
  message: 'Too many pickup verification attempts. Please wait before trying again.',
  keyPrefix: 'pickup:'
}).middleware();

export const couponLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: couponMax,
  message: 'Too many coupon check attempts. Please slow down.',
  keyPrefix: 'coupon:'
}).middleware();

export const globalLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: globalMax,
  message: 'Too many requests. Please slow down.',
  keyPrefix: 'global:'
}).middleware();
