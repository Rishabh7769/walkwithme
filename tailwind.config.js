/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 content paths
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#4338CA',
          subtle: '#E0E7FF',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#6D28D9',
          subtle: '#EDE9FE',
        },
        accent: {
          DEFAULT: '#FBBF24',
          light: '#FCD34D',
          dark: '#D97706',
        },
        // Surfaces (dark mode first)
        surface: {
          DEFAULT: '#111118',
          elevated: '#16161E',
          card: '#1C1C28',
        },
        // Text
        muted: '#9898A8',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        'sans-black': ['Inter_900Black'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
