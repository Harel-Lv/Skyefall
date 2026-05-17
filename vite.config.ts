import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Explicit root URL so production matches dev (important for Vercel).
  base: "/",
  appType: "spa",
  plugins: [react(), tailwindcss()],
});
