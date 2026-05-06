/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          900: '#1E3A5F',
          500: '#3B82F6',
          600: '#2563EB',
          100: '#DBEAFE',
          50: '#F0F9FF',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          600: '#475569',
          700: '#374151',
          900: '#111827',
        },
        red: {
          500: '#EF4444',
        },
        green: {
          500: '#22C55E',
          50: '#F0FDF4',
        },
        yellow: {
          500: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
