/**
 * @description
 * Tailwind CSS configuration file for the AuraTune project.
 * This file defines the design tokens (colors, fonts, spacing, etc.)
 * and plugins used by Tailwind CSS to generate utility classes.
 *
 * Key features:
 * - Content sources pointing to all relevant files within the `src` directory.
 * - Dark mode enabled using the 'media' strategy (respects OS preference).
 * - Extended theme with project-specific color palette and font families.
 * - Includes the `tailwindcss-animate` plugin for Shadcn UI animations.
 */

import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'media', // Uses OS preference for dark mode
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // If using pages router
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // For app router
  ],
  prefix: '', // No prefix for utility classes
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))', // Teal #00A699
          foreground: 'hsl(var(--primary-foreground))', // White for text on primary
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))', // e.g., Light Gray #F7F7F7 or Dark Gray #1E1E1E
          foreground: 'hsl(var(--secondary-foreground))', // Dark text on light gray, Light text on dark gray
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))', // e.g., Red
          foreground: 'hsl(var(--destructive-foreground))', // White text
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))', // Lighter gray
          foreground: 'hsl(var(--muted-foreground))', // Muted text color
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))', // Coral #FF5A5F
          foreground: 'hsl(var(--accent-foreground))', // White for text on accent
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // AuraTune specific colors from the spec
        'auratune-primary': 'hsl(var(--color-primary-default))', // Teal #00A699
        'auratune-accent': 'hsl(var(--color-accent-default))',   // Coral #FF5A5F
        'auratune-neutral-light-1': 'hsl(var(--color-neutral-light-1))', // #FFFFFF
        'auratune-neutral-light-2': 'hsl(var(--color-neutral-light-2))', // #F7F7F7
        'auratune-neutral-dark-1': 'hsl(var(--color-neutral-dark-1))',   // #121212
        'auratune-neutral-dark-2': 'hsl(var(--color-neutral-dark-2))',   // #1E1E1E
        'auratune-text-light': 'hsl(var(--color-text-light-primary))',   // #484848
        'auratune-text-dark': 'hsl(var(--color-text-dark-primary))',     // #E0E0E0
        'spotify-green': 'hsl(var(--color-spotify-green))', // #1DB954
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config