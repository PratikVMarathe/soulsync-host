import { IDENTITY_TYPES } from '../constants/auth';

export const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const extractPhoneDigits = (phoneNumber) => String(phoneNumber || '').replace(/\D/g, '');

export const sanitizePhoneInput = (phoneNumber) => extractPhoneDigits(phoneNumber).slice(0, 10);

export const normalizePhoneNumber = (phoneNumber) => {
  const digits = extractPhoneDigits(phoneNumber);
  return digits.length === 10 ? digits : '';
};

export const isValidPhoneNumber = (phoneNumber) => extractPhoneDigits(phoneNumber).length === 10;

export const getPhoneIdentityKey = (phoneNumber) => normalizePhoneNumber(phoneNumber).replace(/\D/g, '');

export const buildIdentityDocumentId = (type, value) => {
  if (type === IDENTITY_TYPES.EMAIL) return `email_${normalizeEmail(value)}`;
  return `phone_${getPhoneIdentityKey(value)}`;
};

export const formatRoleLabel = (role) => {
  if (!role) return 'User';

  return role
    .split('_')
    .map((token) => token.charAt(0) + token.slice(1).toLowerCase())
    .join(' ');
};

export const formatLevelLabel = (level) => {
  if (!level) return 'Beginner';

  return level
    .split('_')
    .map((token) => token.charAt(0) + token.slice(1).toLowerCase())
    .join(' ');
};
