import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // El minificador de CSS por defecto (lightningcss) falla con semantic-ui-css.
    cssMinify: false,
  },
});
