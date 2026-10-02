// Security Headers Middleware
// Implements OWASP recommended HTTP security headers without external dependencies

export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking / frame embedding
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Modern browsers disable legacy buggy XSS filters
  res.setHeader('X-XSS-Protection', '0');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Isolate browsing context
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // Restrict cross-origin resource sharing for assets
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Restrict browser features and APIs
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(self)');

  // Enforce HTTPS in production with HSTS (1 year)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove identifying Express header
  res.removeHeader('X-Powered-By');

  next();
};
