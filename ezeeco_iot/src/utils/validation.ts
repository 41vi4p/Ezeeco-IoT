// Validation utilities - adapted from web version (no DOM dependencies)

const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

export const validateJoinCode = (code: string): { isValid: boolean; error?: string } => {
  if (!code || code.trim().length === 0) return { isValid: false, error: 'Join code is required' };
  const cleaned = code.trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleaned)) return { isValid: false, error: 'Join code must be exactly 6 digits' };
  return { isValid: true };
};

export const checkRateLimit = (key: string, maxAttempts: number, windowMs: number): boolean => {
  const now = Date.now();
  if (!rateLimitStore[key] || now > rateLimitStore[key].resetTime) {
    rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
    return true;
  }
  if (rateLimitStore[key].count >= maxAttempts) return false;
  rateLimitStore[key].count++;
  return true;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'\/\\]/g, '').slice(0, 200);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  return { isValid: errors.length === 0, errors };
};
