import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Independent static build: the original Grok/Start build is unchanged.
export default defineConfig({
  root: fileURLToPath(new URL("./pages", import.meta.url)),
  base: "/bezeqta/",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [tailwindcss(), react()],
  build: { outDir: fileURLToPath(new URL("./dist", import.meta.url)), emptyOutDir: true },
});
