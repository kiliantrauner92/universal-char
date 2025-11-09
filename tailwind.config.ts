import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface-2)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        accent2: 'var(--color-accent-2)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)'
      }
    }
  },
  plugins: [],
} satisfies Config
