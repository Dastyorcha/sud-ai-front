/** @type {import('tailwindcss').Config} */
import { Config } from "tailwindcss";

export default <Partial<Config>>{
  mode: "jit",
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./directives/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
        screens: {
          sm: "1216px",
        },
      },
      colors: {
        white: {
          DEFAULT: "#FFF",
          100: "#F4F3F5",
        },
        green: {
          DEFAULT: "#59DEBE",
          100: "#19CC81",
          200: "#3FF2C8",
          300: " #19CC81",
        },
        purple: {
          DEFAULT: "#230F4B",
          100: "#3C1880",
        },
        gray: {
          DEFAULT: "#E7E5EA",
          100: "#8C849A",
          200: "#F6F5F7",
          300: "#ACA6B6",
          400: "#D1CED7",
        },
        dark: {
          DEFAULT: "#190A35",
          100: "#000",
        },
        red: {
          DEFAULT: "#FF334C",
        },
      },
      fontFamily: {
        plate: ["AUTO", "sans-serif"],
      },
      lineHeight: {
        130: "130%",
        136: "136%",
        140: "140%",
      },
      borderRadius: {
        20: "20px",
      },
    },
  },
  plugins: [],
};
