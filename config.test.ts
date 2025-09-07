import { describe, it, expect, vi, beforeEach } from 'vitest';

const envKey = 'VITE_GEMINI_API_KEY';

describe('config', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env[envKey];
  });

  it('exports API_KEY when env variable is set', async () => {
    process.env[envKey] = 'abc123';
    const { API_KEY } = await import('./config');
    expect(API_KEY).toBe('abc123');
  });

  it('throws if API key env variable is missing', async () => {
    await expect(import('./config')).rejects.toThrow('VITE_GEMINI_API_KEY environment variable is not set');
  });
});
