import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock for @google/genai
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent
    }
  })),
  Type: { OBJECT: 'object', ARRAY: 'array', STRING: 'string', INTEGER: 'integer' },
  Modality: { IMAGE: 'image', TEXT: 'text' }
}));

describe('geminiService', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGenerateContent.mockReset();
    // @ts-ignore - stub global fetch
    global.fetch = vi.fn();
    process.env.VITE_GEMINI_API_KEY = 'key';
  });

  it('falls back to default context when biography fails to load', async () => {
    // @ts-ignore
    global.fetch.mockRejectedValue(new Error('network'));

    const sample = {
      linea_temporal_real: [],
      puntos_divergencia: [],
      linea_temporal_alternativa_ejemplo: []
    };

    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(sample) });

    const { generateTimelineData } = await import('./geminiService');
    const result = await generateTimelineData('Blas de Lezo', 'es');

    expect(result).toEqual(sample);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents).toContain('Usa tu conocimiento interno');
  });
});
