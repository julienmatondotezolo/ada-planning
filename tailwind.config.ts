import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        ada: {
          primary: '#2563eb', // blue-600
          secondary: '#3b82f6', // blue-500
          accent: '#dbeafe', // blue-100
          dark: '#1e40af', // blue-800
        },
        primary: {
          DEFAULT: '#2563eb', // ADA blue primary
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#64748b', // slate-500
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f1f5f9', // slate-100
          foreground: '#64748b', // slate-500
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a', // slate-900
        },
        background: '#ffffff',
        foreground: '#000000',
      },
    },
  },
  plugins: [],
}
export default config