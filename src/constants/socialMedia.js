export const SOCIAL_PLATFORMS = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
  FACEBOOK: 'facebook',
  TELEGRAM: 'telegram',
};

export const SOCIAL_PLATFORM_CONFIG = {
  whatsapp: {
    label: 'WhatsApp',
    actionLabel: 'Join WhatsApp',
    ariaLabel: 'Join WhatsApp',
    icon: 'whatsapp',
    isPrimarySpecial: true,
  },
  instagram: {
    label: 'Instagram',
    actionLabel: 'Open Instagram',
    ariaLabel: 'Open Instagram',
    icon: 'instagram',
  },
  youtube: {
    label: 'YouTube',
    actionLabel: 'Watch on YouTube',
    ariaLabel: 'Watch on YouTube',
    icon: 'youtube',
  },
  facebook: {
    label: 'Facebook',
    actionLabel: 'Open Facebook',
    ariaLabel: 'Open Facebook',
    icon: 'facebook',
  },
  telegram: {
    label: 'Telegram',
    actionLabel: 'Join Telegram',
    ariaLabel: 'Join Telegram',
    icon: 'telegram',
  },
};

export const DEFAULT_SOCIAL_LINKS = {
  whatsapp: '',
  instagram: '',
  youtube: '',
  facebook: '',
  telegram: '',
};

export function normalizeSocialLinks(socialLinks) {
  if (!socialLinks || typeof socialLinks !== 'object') {
    return { ...DEFAULT_SOCIAL_LINKS };
  }

  return {
    whatsapp: (socialLinks.whatsapp || '').trim(),
    instagram: (socialLinks.instagram || '').trim(),
    youtube: (socialLinks.youtube || '').trim(),
    facebook: (socialLinks.facebook || '').trim(),
    telegram: (socialLinks.telegram || '').trim(),
  };
}

export function getActiveSocialLinks(socialLinks) {
  const normalized = normalizeSocialLinks(socialLinks);
  const active = [];

  // WhatsApp first if configured
  if (normalized.whatsapp) {
    active.push({
      platform: 'whatsapp',
      url: normalized.whatsapp,
      ...SOCIAL_PLATFORM_CONFIG.whatsapp,
    });
  }

  const otherPlatforms = ['instagram', 'youtube', 'facebook', 'telegram'];
  for (const platform of otherPlatforms) {
    if (normalized[platform]) {
      active.push({
        platform,
        url: normalized[platform],
        ...SOCIAL_PLATFORM_CONFIG[platform],
      });
    }
  }

  return active;
}
