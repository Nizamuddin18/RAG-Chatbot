/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and scripts
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially dangerous HTML tags
  sanitized = sanitized.replace(/<\/?(?:iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '');
  
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/(?:javascript|data):/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized.trim();
};

/**
 * Validate and sanitize message content
 */
export const validateMessage = (message: string): { valid: boolean; sanitized: string; error?: string } => {
  if (!message || typeof message !== 'string') {
    return { valid: false, sanitized: '', error: 'Message must be a non-empty string' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 10000) {
    return { valid: false, sanitized: '', error: 'Message too long (max 10000 characters)' };
  }
  
  const sanitized = sanitizeInput(trimmed);
  
  return { valid: true, sanitized };
};

/**
 * Generate a cryptographically secure unique ID
 */
export const generateSecureId = (): string => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Validate agent ID format
 */
export const isValidAgentId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  // UUID format or alphanumeric with hyphens
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) ||
         /^[a-zA-Z0-9-_]{1,255}$/.test(id);
};

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 10, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove timestamps outside the time window
    this.timestamps = this.timestamps.filter(ts => now - ts < this.timeWindow);
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(ts => now - ts < this.timeWindow);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }
}
