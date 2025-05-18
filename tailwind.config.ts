import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Adjusted to scan all relevant files in src
  ],
  theme: {
    extend: {
      // Theme extensions (colors, fonts) will be added in Step 0.4
    },
  },
  plugins: [
    // Plugins like tailwindcss-animate will be added later when Shadcn is configured
  ],
} satisfies Config