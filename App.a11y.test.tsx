import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe } from 'vitest-axe';
import { expect, test, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.VITE_GEMINI_API_KEY = 'test';
});

test('App should have no accessibility violations', async () => {
  const { default: App } = await import('./App');
  const { container } = render(<App />);
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
});
