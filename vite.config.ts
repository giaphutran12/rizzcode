import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { rizzcodeJudgePlugin } from "./src/server/judge/vitePlugin";

export default defineConfig({
  plugins: [react(), rizzcodeJudgePlugin()],
  server: {
    host: "127.0.0.1",
    port: 4273,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4273,
    strictPort: true,
  },
});
