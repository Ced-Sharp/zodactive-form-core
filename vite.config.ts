import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ZodactiveForm",
      fileName: (format) =>
        format === "es" ? "zodactive-form.js" : "zodactive-form.umd.js",
    },
    rollupOptions: {
      external: ["zod"],
      output: {
        inlineDynamicImports: true,
        globals: {
          zod: "zod",
        },
      },
    },
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
