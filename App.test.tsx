import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('HeroSection', () => {
  it('shows guidance steps and generate button', async () => {
    process.env.VITE_GEMINI_API_KEY = 'test';
    const { default: App } = await import('./App');
    render(<App />);
    expect(screen.getByText(/Sigue estos pasos/i)).toBeInTheDocument();
    expect(screen.getByText(/Nano Banana/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generar Línea Temporal/i })).toBeInTheDocument();
  });
});
