import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const serverUrl =
    process.env["services__server__https__0"] ||
    process.env["services__server__http__0"];

export default defineConfig({
    plugins: [react()],

    server: {
        proxy: {
            "/api": {
                target: serverUrl,
                changeOrigin: true,
                secure: false
            }
        }
    }
});