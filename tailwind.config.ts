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
          primary: '#064e3b',
          secondary: '#a3e635',
          accent: '#0f766e',
        },
        primary: {
          DEFAULT: '#064e3b', // ada primary
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
      },
    },
  },
  plugins: [],
}
export default config