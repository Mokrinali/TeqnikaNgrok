/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue:   '#007AFF',
        green:  '#34C759',
        red:    '#FF3B30',
        orange: '#FF9F0A',
        bg:     '#F2F2F7',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
}
