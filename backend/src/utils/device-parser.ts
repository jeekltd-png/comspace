/**
 * Parse a user-agent string into structured device information.
 * Lightweight implementation — no external dependency required.
 */
export function parseUserAgent(ua?: string): {
  type: string;
  os: string;
  browser: string;
  isMobile: boolean;
} {
  if (!ua) return { type: 'unknown', os: 'unknown', browser: 'unknown', isMobile: false };

  // ── Detect OS ──────────────────────────────────────────────
  let os = 'unknown';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/mac os x/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/OS (\d+_\d+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/Android (\d+\.?\d*)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  // ── Detect browser ────────────────────────────────────────
  let browser = 'unknown';
  if (/edg\//i.test(ua)) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    const match = ua.match(/(?:OPR|Opera)\/(\d+)/i);
    browser = match ? `Opera ${match[1]}` : 'Opera';
  } else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    const match = ua.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  } else if (/firefox/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  // ── Detect device type ────────────────────────────────────
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /tablet|ipad|playbook|silk/i.test(ua);
  let type = 'desktop';
  if (isTablet) type = 'tablet';
  else if (isMobile) type = 'mobile';

  // Detect bots/crawlers
  if (/bot|crawler|spider|curl|wget|postman|insomnia/i.test(ua)) {
    type = 'bot';
  }

  return { type, os, browser, isMobile };
}

/**
 * Extract the client IP from a request, handling proxies.
 */
export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    return first;
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}
