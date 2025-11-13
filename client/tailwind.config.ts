import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Unisex, laidback, playful, sleek & luxe palette
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7cfc7',
          300: '#a3b0a3',
          400: '#7f8f7f',
          500: '#647264',
          600: '#4f5d4f',
          700: '#414d41',
          800: '#374037',
          900: '#2f372f',
        },
        terracotta: {
          50: '#fef5f0',
          100: '#fde8db',
          200: '#facdb5',
          300: '#f6a884',
          400: '#f17a51',
          500: '#ed5a2d',
          600: '#de3f13',
          700: '#b82f11',
          800: '#922816',
          900: '#772515',
        },
        lavender: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        cream: {
          50: '#fefdfb',
          100: '#fef9f3',
          200: '#fdf2e6',
          300: '#fbe8d1',
          400: '#f8d9b3',
          500: '#f4c794',
          600: '#efb06e',
          700: '#e8964a',
          800: '#d17a2f',
          900: '#ae6426',
        },
        warm: {
          gray: '#8b8680',
          beige: '#f5f1eb',
          stone: '#e8e3dc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'luxe': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
export default config

