import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl, notifyAdminInterestRequest } from './interestNotificationService';

describe('interestNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('determines appropriate API base URL', () => {
    const url = getApiBaseUrl();
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');
  });

  it('successfully dispatches POST request to /api/interest-requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, requestId: 'test-id' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const payload = {
      name: 'Pratik Marathe',
      email: 'pratik@example.com',
      phoneNumber: '9876543210',
      age: 24,
      passion: 'STUDENT',
      institutionName: 'ABC College',
      mode: 'ONLINE',
      language: 'HINDI',
      preferredDay: 'SUNDAY',
    };

    await notifyAdminInterestRequest(payload);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [endpoint, options] = mockFetch.mock.calls[0];
    expect(endpoint).toContain('/api/interest-requests');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('does not throw or disrupt flow when API call fails (Phase 10 resilient behavior)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    // Should complete cleanly without rejecting
    await expect(notifyAdminInterestRequest({ name: 'Fail Test' })).resolves.toBeUndefined();
  });
});
