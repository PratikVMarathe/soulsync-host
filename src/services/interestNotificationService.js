/**
 * Resolves the base URL for the backend API (soulsync-api)
 */
export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL || import.meta.env.VITE_IMAGE_API_URL;
  if (url) {
    return url.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5003';
  }
  return 'https://soulsync-api-mlw9.onrender.com';
}

/**
 * Notifies the backend (soulsync-api) of a newly submitted interest request
 * so it can dispatch an email notification to the admin via Brevo.
 *
 * Phase 10 compliance: Any failure in this dispatch is logged but non-blocking,
 * ensuring the user never sees an error if Firestore save succeeded.
 */
export async function notifyAdminInterestRequest(payload) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${baseUrl}/api/interest-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[InterestNotification] soulsync-api responded with status ${response.status}: ${errText}`);
    }
  } catch (err) {
    console.warn('[InterestNotification] Could not notify soulsync-api of interest request:', err.message);
  }
}
