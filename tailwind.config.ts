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
          faint: '#8a8680',
        },
        ember: '#c9a35b', // a single restrained accent
      },
      fontFamily: {
        // Fraunces: a soft, literary display serif for themes and titles.
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Newsreader: a readable text serif tuned for long-form passages.
        body: ['Newsreader', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      keyframes: {
        // A facet tile settling into place: a small rise and fade.
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // The detail veil drawing across the field.
        veil: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // The detail panel rising into view.
        lift: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        veil: 'veil 0.25s ease-out both',
        lift: 'lift 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
