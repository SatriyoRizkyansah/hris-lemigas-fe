/* eslint-disable @typescript-eslint/ban-ts-comment */

import { defineConfig, TerserOptions, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import TsConfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";
// @ts-ignore
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 8030,
      host: true,
      proxy: {
        "/api": {
          target: env.VITE_APP_ENDPOINT,
          changeOrigin: true,
        },
      },
      hmr: {
        overlay: true,
      },
    },

    plugins: [react(), TsConfigPaths(), checker({ typescript: true }), ViteImageOptimizer()],

    cacheDir: "./.vite",

    resolve: {
      alias: {},
    },

    optimizeDeps: {
      entries: ["src/**/*.ts", "src/**/*.tsx"],
      holdUntilCrawlEnd: true,
      exclude: ["@ckeditor/ckeditor5-vue", "@emotion/react", "@emotion/styled"],
      include: ["hoist-non-react-statics"],
    },

    esbuild: {
      legalComments: "none",
    },

    build: {
      outDir: "build",
      chunkSizeWarningLimit: 1000,
      minify: "terser",
      terserOptions: {
        format: { comments: false },
      } as TerserOptions,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("@ckeditor")) {
              return "ckeditor";
            }
          },
        },
      },
    },
  };
});
