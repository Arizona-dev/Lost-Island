import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy des requêtes /api vers votre serveur backend
      "/api": {
        target: "http://localhost:3000", // URL de votre serveur backend
        changeOrigin: true, // Nécessaire pour les serveurs virtuels hébergés derrière un proxy inverse
        secure: false, // Définissez-le sur false si le backend est servi sur http
        // Si vous avez besoin de réécrire le chemin des requêtes :
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});
