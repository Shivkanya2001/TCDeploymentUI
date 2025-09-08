import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // 👈 change from 5173 to 3000
    strictPort: true, // fails if 3000 is already taken (optional)
    host: "localhost", // or "0.0.0.0" if you want LAN access
  },
});
