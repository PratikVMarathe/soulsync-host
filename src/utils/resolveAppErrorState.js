const STATUS_PRESETS = {
  403: {
    title: 'Access Restricted',
    message: 'Your account does not have permission to view this part of SoulSync.',
  },
  404: {
    title: 'Page Not Found',
    message: 'The page or content you are looking for could not be found.',
  },
  408: {
    title: 'Request Timed Out',
    message: 'SoulSync took too long to respond. Please try again.',
  },
  500: {
    title: 'Something Went Wrong',
    message: 'SoulSync hit an unexpected issue while loading this experience.',
  },
  502: {
    title: 'Service Unavailable',
    message: 'A connected service did not respond correctly. Please try again shortly.',
  },
  503: {
    title: 'Service Unavailable',
    message: 'SoulSync is temporarily unavailable right now. Please try again shortly.',
  },
  504: {
    title: 'Gateway Timeout',
    message: 'A dependent service took too long to respond. Please try again.',
  },
  default: {
    title: 'Unexpected Error',
    message: 'Something unexpected happened while loading SoulSync.',
  },
};

function inferStatusCode(error) {
  const explicitStatus = Number(error?.statusCode || error?.status);
  if (Number.isFinite(explicitStatus) && explicitStatus > 0) {
    return explicitStatus;
  }

  const errorCode = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const errorName = String(error?.name || '').toLowerCase();

  if (errorCode === 'permission-denied') return 403;
  if (errorCode === 'not-found') return 404;
  if (errorCode === 'deadline-exceeded') return 408;
  if (errorCode === 'unavailable') return 503;
  if (errorCode === 'internal') return 500;

  if (
    errorName.includes('chunkloaderror')
    || message.includes('failed to fetch dynamically imported module')
    || message.includes('error loading remotely hosted module')
    || message.includes('importing a module script failed')
    || message.includes('load failed')
  ) {
    return 502;
  }

  if (message.includes('failed to fetch') || message.includes('networkerror')) {
    return 503;
  }

  return 500;
}

export function resolveAppErrorState(error, overrides = {}) {
  const statusCode = overrides.statusCode || inferStatusCode(error);
  const preset = STATUS_PRESETS[statusCode] || STATUS_PRESETS.default;

  return {
    statusCode,
    title: overrides.title || preset.title,
    message: overrides.message || error?.publicMessage || error?.message || preset.message,
  };
}
