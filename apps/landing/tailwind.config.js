/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#15101a",
        secondary: "#1d1d25",
        accent: "#153a7d",
        danger: "#bf0603",
        warning: "#ffb703",
        success: "#606c38",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
