import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pool: {
          50: "#eefcfb",
          100: "#d4f6f5",
          500: "#0ea5a4",
          600: "#0d9488",
          700: "#0f766e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
