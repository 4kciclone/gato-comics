/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},  // <--- Note que voltou a ser apenas "tailwindcss"
    autoprefixer: {},
  },
};

export default config;