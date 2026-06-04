/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soul-ivory': '#F5F4EF',
        'soul-green': '#A8BF73',
        'primary-dark': '#2F4F4F', 
      },
      backgroundImage: {
        'leaf-pattern': "url('/leaf.png')",
      }
    },
  },
  plugins: [],
}