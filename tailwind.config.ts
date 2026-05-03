import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fafafa',
        ink: '#1a1a1a',
        muted: { DEFAULT: '#666', light: '#888', soft: '#aaa' },
        accent: { DEFAULT: '#00A94F', soft: '#e8f7ee' },
        line: '#eee',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
