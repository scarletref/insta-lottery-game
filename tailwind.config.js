// tailwind.config.js
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        animation: {
            'spin-slow': 'spin 4.5s ease-out',
          },       
      },
    },
    plugins: [],
  };

  