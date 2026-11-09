import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/static/admin_ui/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL("../backend/static/admin_ui", import.meta.url)),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: fileURLToPath(new URL("./src/admin/main.tsx", import.meta.url)),
      output: {
        entryFileNames: "admin.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? "";
          return name.endsWith(".css")
            ? "admin.css"
            : "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
