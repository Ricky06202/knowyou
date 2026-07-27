import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 4321 },
  vite: {
    server: { port: 4321 },
    plugins: [tailwindcss()],
  },
});
