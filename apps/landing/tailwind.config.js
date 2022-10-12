/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#171010",
        secondary: "#2B2B2B",
        accent: "#153a7d",
        danger: "#bf0603",
        warning: "#ffb703",
        success: "#606c38",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        styled: ["Buhkari", "cursive"],
        azonix: ["Azonix", "sans-serif"],
      },
      animation: {
        "gradient-x": "gradient-x 7s ease infinite",
        "gradient-y": "gradient-y 7s ease infinite",
        "gradient-xy": "gradient-xy 7s ease infinite",
      },
      keyframes: {
        "gradient-y": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "center top",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center center",
          },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
