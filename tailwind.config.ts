import type { Config } from 'tailwindcss';

// The Nocturnal Index: dark, restrained, typographic.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Near-black field with restrained warm ink/parchment foreground.
        night: {
          DEFAULT: '#0a0a0c',
          soft: '#111114',
          raised: '#17171c',
        },
        ink: {
          DEFAULT: '#e8e4d9', // parchment foreground
          muted: '#9a958a',
          faint: '#5c5950',
        },
        ember: '#c9a35b', // a single restrained accent
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
    },
  },
  plugins: [],
} satisfies Config;
