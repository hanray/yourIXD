import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@components": path.resolve(__dirname, "src/components"),
      "@state": path.resolve(__dirname, "src/state"),
      "@models": path.resolve(__dirname, "src/models"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@data": path.resolve(__dirname, "src/data"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@styles": path.resolve(__dirname, "src/styles")
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
