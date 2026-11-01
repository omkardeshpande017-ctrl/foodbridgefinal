// Security headers without external dependencies (helmet-compatible subset).
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  // This policy is applied to the API's own JSON responses. `default-src 'none'`
  // is correct for them, but the same policy is inherited by anything the API
  // serves, so it is kept minimal and explicit. It must NOT be copied onto the
  // frontend's HTML (nginx/vercel set their own headers there).
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  // HSTS is only meaningful over HTTPS. Sending it from a plain-HTTP origin (local
  // Docker stack, LAN dev) makes browsers pin https://localhost and then fail to
  // reach the HTTP-only API on the next request, so it is emitted for TLS requests only.
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const isTls = req.secure || forwardedProto === 'https' || Boolean(req.socket?.encrypted);
  if (process.env.NODE_ENV === 'production' && isTls) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

export default securityHeaders;
