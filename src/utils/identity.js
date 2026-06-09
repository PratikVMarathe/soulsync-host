import { IDENTITY_TYPES } from '../constants/auth';

export const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

export const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  const digits = String(phoneNumber).replace(/\D/g, '');
  if (!digits) return '';

  return String(phoneNumber).trim().startsWith('+')
    ? `+${digits}`
    : digits;
};

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
