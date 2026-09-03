import { describe, expect, it } from 'vitest';
import {
  buildIdentityDocumentId,
  extractPhoneDigits,
  formatLevelLabel,
  formatRoleLabel,
  isValidEmail,
  isValidPhoneNumber,
  normalizeEmail,
  normalizePhoneNumber,
  sanitizePhoneInput,
} from './identity';

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('returns true for valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.devotee@soulsync.org')).toBe(true);
  });

  it('returns false for invalid formats', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

// ─── normalizeEmail ───────────────────────────────────────────────────────────

describe('normalizeEmail', () => {
  it('lowercases the email', () => {
    expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  hello@world.com  ')).toBe('hello@world.com');
  });

  it('returns empty string for null', () => {
    expect(normalizeEmail(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeEmail(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeEmail('')).toBe('');
  });

  it('handles email with subdomain', () => {
    expect(normalizeEmail('User@Mail.Sub.Domain.COM')).toBe('user@mail.sub.domain.com');
  });
});

// ─── extractPhoneDigits ───────────────────────────────────────────────────────

describe('extractPhoneDigits', () => {
  it('removes non-digit characters', () => {
    expect(extractPhoneDigits('+91 98765-43210')).toBe('919876543210');
  });

  it('handles pure digits', () => {
    expect(extractPhoneDigits('9876543210')).toBe('9876543210');
  });

  it('handles empty string', () => {
    expect(extractPhoneDigits('')).toBe('');
  });

  it('handles null', () => {
    expect(extractPhoneDigits(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(extractPhoneDigits(undefined)).toBe('');
  });

  it('strips letters too', () => {
    expect(extractPhoneDigits('abc123def')).toBe('123');
  });
});

// ─── sanitizePhoneInput ───────────────────────────────────────────────────────

describe('sanitizePhoneInput', () => {
  it('strips non-digits and clamps to 10 characters', () => {
    expect(sanitizePhoneInput('+91 98765-43210')).toBe('9198765432');
  });

  it('returns exactly 10 digits when already 10', () => {
    expect(sanitizePhoneInput('9876543210')).toBe('9876543210');
  });

  it('returns fewer than 10 digits without padding', () => {
    expect(sanitizePhoneInput('12345')).toBe('12345');
  });

  it('handles empty string', () => {
    expect(sanitizePhoneInput('')).toBe('');
  });
});

// ─── normalizePhoneNumber ─────────────────────────────────────────────────────

describe('normalizePhoneNumber', () => {
  it('returns 10 digits for a valid 10-digit number', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('9876543210');
  });

  it('strips formatting characters and returns digits', () => {
    expect(normalizePhoneNumber('98-7654-3210')).toBe('9876543210');
  });

  it('returns empty string when fewer than 10 digits', () => {
    expect(normalizePhoneNumber('98765')).toBe('');
  });

  it('returns empty string when more than 10 digits', () => {
    expect(normalizePhoneNumber('91987654321011')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(normalizePhoneNumber(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizePhoneNumber('')).toBe('');
  });

  it('returns empty string for non-digit input', () => {
    expect(normalizePhoneNumber('abcdefghij')).toBe('');
  });
});

// ─── isValidPhoneNumber ───────────────────────────────────────────────────────

describe('isValidPhoneNumber', () => {
  it('returns true for exactly 10 digits', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true);
  });

  it('returns true for 10-digit number with formatting', () => {
    expect(isValidPhoneNumber('98-7654-3210')).toBe(true);
  });

  it('returns false for 9 digits', () => {
    expect(isValidPhoneNumber('987654321')).toBe(false);
  });

  it('returns false for 11 digits', () => {
    expect(isValidPhoneNumber('98765432101')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPhoneNumber('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidPhoneNumber(null)).toBe(false);
  });

  it('returns false for letters only', () => {
    expect(isValidPhoneNumber('abcdefghij')).toBe(false);
  });
});

// ─── buildIdentityDocumentId ──────────────────────────────────────────────────

describe('buildIdentityDocumentId', () => {
  it('builds email lock id with "email_" prefix (lowercased)', () => {
    expect(buildIdentityDocumentId('EMAIL', 'User@Example.COM')).toBe('email_user@example.com');
  });

  it('builds phone lock id with "phone_" prefix', () => {
    expect(buildIdentityDocumentId('PHONE', '9876543210')).toBe('phone_9876543210');
  });

  it('strips phone formatting when building phone lock id', () => {
    expect(buildIdentityDocumentId('PHONE', '98-7654-3210')).toBe('phone_9876543210');
  });

  it('falls back to phone prefix for unknown type', () => {
    expect(buildIdentityDocumentId('UNKNOWN', '9876543210')).toBe('phone_9876543210');
  });
});

// ─── formatRoleLabel ──────────────────────────────────────────────────────────

describe('formatRoleLabel', () => {
  it('formats SUPER_ADMIN to "Super Admin"', () => {
    expect(formatRoleLabel('SUPER_ADMIN')).toBe('Super Admin');
  });

  it('formats USER to "User"', () => {
    expect(formatRoleLabel('USER')).toBe('User');
  });

  it('returns "User" for null', () => {
    expect(formatRoleLabel(null)).toBe('User');
  });

  it('returns "User" for undefined', () => {
    expect(formatRoleLabel(undefined)).toBe('User');
  });
});

// ─── formatLevelLabel ─────────────────────────────────────────────────────────

describe('formatLevelLabel', () => {
  it('formats ADVANCED to "Advanced"', () => {
    expect(formatLevelLabel('ADVANCED')).toBe('Advanced');
  });

  it('formats INTERMEDIATE_PLUS to "Intermediate Plus"', () => {
    expect(formatLevelLabel('INTERMEDIATE_PLUS')).toBe('Intermediate Plus');
  });

  it('returns "Beginner" for null', () => {
    expect(formatLevelLabel(null)).toBe('Beginner');
  });

  it('returns "Beginner" for undefined', () => {
    expect(formatLevelLabel(undefined)).toBe('Beginner');
  });
});
