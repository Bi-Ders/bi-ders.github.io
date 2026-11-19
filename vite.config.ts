import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base`: bi-ders.github.io bir organizasyon sayfası olduğu için kök dizinden ("/") yayınlanır.
// Cloudflare Pages + özel alan adında da "/" kullanılır. Proje sayfası (kullanici.github.io/repo)
// olarak yayınlanacaksa VITE_BASE_PATH=/repo/ verin ve public/404.html içindeki
// pathSegmentsToKeep değerini 1 yapın.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
})
