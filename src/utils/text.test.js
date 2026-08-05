import { describe, expect, it } from 'vitest';
import { normalizeWhitespace, toTitleCase } from './text';

// ─── normalizeWhitespace ──────────────────────────────────────────────────────

describe('normalizeWhitespace', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('collapses multiple internal spaces to one', () => {
    expect(normalizeWhitespace('hello   world')).toBe('hello world');
  });

  it('collapses tabs and newlines', () => {
    expect(normalizeWhitespace('hello\t\nworld')).toBe('hello world');
  });

  it('returns empty string for null', () => {
    expect(normalizeWhitespace(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalizeWhitespace(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalizeWhitespace('')).toBe('');
  });

  it('handles already-normalized string without change', () => {
    expect(normalizeWhitespace('hello world')).toBe('hello world');
  });
});

// ─── toTitleCase ──────────────────────────────────────────────────────────────

describe('toTitleCase', () => {
  it('capitalizes a single word', () => {
    expect(toTitleCase('priya')).toBe('Priya');
  });

  it('capitalizes each word in a multi-word name', () => {
    expect(toTitleCase('priya sharma')).toBe('Priya Sharma');
  });

  it('lowercases the rest of each word', () => {
    expect(toTitleCase('PRIYA SHARMA')).toBe('Priya Sharma');
  });

  it('handles mixed-case input', () => {
    expect(toTitleCase('prIYa SHARma')).toBe('Priya Sharma');
  });

  it('preserves hyphens in hyphenated names', () => {
    expect(toTitleCase('mary-anne jones')).toBe('Mary-Anne Jones');
  });

  it('capitalizes after a hyphen', () => {
    expect(toTitleCase('o-brien')).toBe('O-Brien');
  });

  it('preserves apostrophes in names', () => {
    expect(toTitleCase("o'connor")).toBe("O'Connor");
  });

  it('passes email addresses through unchanged', () => {
    expect(toTitleCase('user@example.com')).toBe('user@example.com');
  });

  it('returns empty string for null', () => {
    expect(toTitleCase(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toTitleCase(undefined)).toBe('');
  });

  it('returns empty string for whitespace-only string', () => {
    expect(toTitleCase('   ')).toBe('');
  });

  it('normalizes extra spaces before capitalizing', () => {
    expect(toTitleCase('  rama   krishna  ')).toBe('Rama Krishna');
  });

  it('handles single-character name', () => {
    expect(toTitleCase('a')).toBe('A');
  });

  it('handles names with backtick separators', () => {
    expect(toTitleCase('sri`la')).toBe('Sri`La');
  });
});
