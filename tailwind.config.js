/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        creal: {
          bg: 'rgba(10, 10, 20, 0.85)',
          accent: '#00D9FF',
          warning: '#FF6B00',
          danger: '#FF0055',
          neutral: '#60A5FA',
        },
      },
      fontFamily: {
        header: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 217, 255, 0.3)',
        'neon-warning': '0 0 20px rgba(255, 107, 0, 0.3)',
        'neon-danger': '0 0 20px rgba(255, 0, 85, 0.3)',
      },
    },
  },
  plugins: [],
};
