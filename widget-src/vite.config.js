import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Dev server — proxies /api to the Python backend
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
    open: "/widget-demo.html",
  },

  // Production build — single IIFE output
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "Hey804Widget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    outDir: resolve(__dirname, "../web"),
    emptyDir: false,
    cssCodeSplit: false,
    minify: "terser",
  },

  // Test config
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.js"],
  },
});
