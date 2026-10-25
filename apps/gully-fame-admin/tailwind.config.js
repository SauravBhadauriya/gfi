// Theme mirrors the mobile app: near-black surfaces (#1A1A1A / #252525 / #2A2A2A) with the #EC9A15 orange accent.
// Existing light-theme utility classes are remapped here so every page picks up the app theme.
const tint = (rgb) => ({
  50: `rgba(${rgb}, 0.10)`,
  100: `rgba(${rgb}, 0.16)`,
  200: `rgba(${rgb}, 0.32)`,
  300: `rgba(${rgb}, 0.45)`,
});

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#1A1A1A',
          surface: '#252525',
          raised: '#2A2A2A',
          border: '#3A3A3A',
          brown: '#3C2610',
          sidebar: '#141414',
        },
        primary: {
          50: '#2A1D0C',
          100: '#3C2610',
          200: '#5A3A14',
          300: '#7A4E18',
          400: '#F9C270',
          500: '#EC9A15',
          600: '#EC9A15',
          700: '#D88A13',
          800: '#B8720F',
          900: '#985A0C',
        },
        // inverted so text-gray-900 is light and bg-gray-50 is a dark surface
        gray: {
          50: '#2A2A2A',
          100: '#303030',
          200: '#3A3A3A',
          300: '#4A4A4A',
          400: '#8A8F98',
          500: '#9CA3AF',
          600: '#C4C8CE',
          700: '#D8DBDF',
          800: '#ECEDEE',
          900: '#FFFFFF',
        },
        red: tint('255, 59, 48'),
        green: tint('34, 197, 94'),
        blue: tint('59, 130, 246'),
        yellow: tint('255, 215, 0'),
        purple: tint('168, 85, 247'),
        orange: tint('255, 140, 0'),
      },
    },
  },
  plugins: [],
};
