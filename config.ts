const key = import.meta.env.VITE_GEMINI_API_KEY;
if (!key) {
  throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
}
export const API_KEY = key;
