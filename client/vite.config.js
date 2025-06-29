import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import vueDevTools from "vite-plugin-vue-devtools";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  preview: {
    port: parseInt(process.env.VITE_DEV_PORT) || 5173,
    host: true,
  },
  server: {
    port: parseInt(process.env.VITE_DEV_PORT) || 5173,
    host: true,
  },
});
