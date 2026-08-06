import { describe, expect, it } from 'vitest';
import { resolveAppErrorState } from './resolveAppErrorState';

// ─── Status code inference ─────────────────────────────────────────────────────

describe('resolveAppErrorState — status code from statusCode field', () => {
  it('uses explicit statusCode when provided', () => {
    const result = resolveAppErrorState({ statusCode: 404 });
    expect(result.statusCode).toBe(404);
  });

  it('uses explicit status field when statusCode absent', () => {
    const result = resolveAppErrorState({ status: 403 });
    expect(result.statusCode).toBe(403);
  });

  it('prefers statusCode over status when both present', () => {
    const result = resolveAppErrorState({ statusCode: 404, status: 500 });
    expect(result.statusCode).toBe(404);
  });
});

describe('resolveAppErrorState — Firebase error code mapping', () => {
  it('maps "permission-denied" to 403', () => {
    expect(resolveAppErrorState({ code: 'permission-denied' }).statusCode).toBe(403);
  });

  it('maps "not-found" to 404', () => {
    expect(resolveAppErrorState({ code: 'not-found' }).statusCode).toBe(404);
  });

  it('maps "deadline-exceeded" to 408', () => {
    expect(resolveAppErrorState({ code: 'deadline-exceeded' }).statusCode).toBe(408);
  });

  it('maps "unavailable" to 503', () => {
    expect(resolveAppErrorState({ code: 'unavailable' }).statusCode).toBe(503);
  });

  it('maps "internal" to 500', () => {
    expect(resolveAppErrorState({ code: 'internal' }).statusCode).toBe(500);
  });

  it('defaults to 500 for unknown error code', () => {
    expect(resolveAppErrorState({ code: 'unknown-error' }).statusCode).toBe(500);
  });
});

describe('resolveAppErrorState — MFE / chunk load error mapping', () => {
  it('maps ChunkLoadError name to 502', () => {
    expect(resolveAppErrorState({ name: 'ChunkLoadError' }).statusCode).toBe(502);
  });

  it('maps "failed to fetch dynamically imported module" message to 502', () => {
    expect(
      resolveAppErrorState({ message: 'Failed to fetch dynamically imported module' }).statusCode,
    ).toBe(502);
  });

  it('maps "error loading remotely hosted module" message to 502', () => {
    expect(
      resolveAppErrorState({ message: 'Error loading remotely hosted module' }).statusCode,
    ).toBe(502);
  });

  it('maps "importing a module script failed" to 502', () => {
    expect(
      resolveAppErrorState({ message: 'Importing a module script failed' }).statusCode,
    ).toBe(502);
  });

  it('maps "load failed" to 502', () => {
    expect(resolveAppErrorState({ message: 'Load failed' }).statusCode).toBe(502);
  });
});

describe('resolveAppErrorState — network error mapping', () => {
  it('maps "failed to fetch" message to 503', () => {
    expect(resolveAppErrorState({ message: 'Failed to fetch' }).statusCode).toBe(503);
  });

  it('maps "NetworkError" message to 503', () => {
    expect(resolveAppErrorState({ message: 'A NetworkError occurred' }).statusCode).toBe(503);
  });
});

// ─── Title and message resolution ─────────────────────────────────────────────

describe('resolveAppErrorState — preset titles', () => {
  const cases = [
    [403, 'Access Restricted'],
    [404, 'Page Not Found'],
    [408, 'Request Timed Out'],
    [500, 'Something Went Wrong'],
    [502, 'Service Unavailable'],
    [503, 'Service Unavailable'],
    [504, 'Gateway Timeout'],
  ];

  it.each(cases)('status %i returns title "%s"', (statusCode, expectedTitle) => {
    const result = resolveAppErrorState({ statusCode });
    expect(result.title).toBe(expectedTitle);
  });

  it('unknown status code returns "Unexpected Error"', () => {
    expect(resolveAppErrorState({ statusCode: 418 }).title).toBe('Unexpected Error');
  });
});

describe('resolveAppErrorState — message priority', () => {
  it('uses override message when provided', () => {
    const result = resolveAppErrorState(
      { statusCode: 403 },
      { message: 'Custom override message' },
    );
    expect(result.message).toBe('Custom override message');
  });

  it('uses error.publicMessage over error.message', () => {
    const result = resolveAppErrorState({
      message: 'raw internal message',
      publicMessage: 'user-friendly message',
    });
    expect(result.message).toBe('user-friendly message');
  });

  it('falls back to error.message when no publicMessage', () => {
    const result = resolveAppErrorState({ code: 'not-found', message: 'doc missing' });
    expect(result.message).toBe('doc missing');
  });

  it('falls back to preset message when no error message', () => {
    const result = resolveAppErrorState({ code: 'not-found' });
    expect(result.message).toBe('The page or content you are looking for could not be found.');
  });
});

// ─── Overrides ────────────────────────────────────────────────────────────────

describe('resolveAppErrorState — overrides', () => {
  it('statusCode override takes precedence over inferred code', () => {
    const result = resolveAppErrorState({ code: 'not-found' }, { statusCode: 500 });
    expect(result.statusCode).toBe(500);
    expect(result.title).toBe('Something Went Wrong');
  });

  it('title override replaces preset title', () => {
    const result = resolveAppErrorState({ statusCode: 404 }, { title: 'Custom 404' });
    expect(result.title).toBe('Custom 404');
  });

  it('returns all three fields in the result', () => {
    const result = resolveAppErrorState({ statusCode: 403 });
    expect(result).toHaveProperty('statusCode');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('message');
  });
});

// ─── Null / undefined safety ───────────────────────────────────────────────────

describe('resolveAppErrorState — null safety', () => {
  it('handles null error gracefully', () => {
    const result = resolveAppErrorState(null);
    expect(result.statusCode).toBe(500);
    expect(result.title).toBe('Something Went Wrong');
  });

  it('handles undefined error gracefully', () => {
    const result = resolveAppErrorState(undefined);
    expect(result.statusCode).toBe(500);
  });

  it('handles empty object gracefully', () => {
    const result = resolveAppErrorState({});
    expect(result.statusCode).toBe(500);
  });
});
