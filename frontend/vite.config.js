import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // El minificador de CSS por defecto (lightningcss) falla con semantic-ui-css.
    cssMinify: false,
  },
  server: {
    proxy: {
      // El navegador llama a /freetogame/games y Vite lo reenvía a
      // https://www.freetogame.com/api/games (evita problemas de CORS).
      "/freetogame": {
        target: "https://www.freetogame.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freetogame/, "/api"),
      },
    },
  },
});