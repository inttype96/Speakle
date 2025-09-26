import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // SockJS-client의 global 객체 폴리필
    global: 'globalThis',
  },
  // 프록시 설정을 추가합니다.
  server: {
    port: 3000,
    proxy: {
      // '/api'로 시작하는 요청은 모두 백엔드 서버로 전달합니다.
      '/api': {
        // target: 'https://j13c104.p.ssafy.io',
        target: 'http://localhost:8080',
        changeOrigin: true, // 다른 origin으로 요청을 보낼 때 필요합니다.
        secure: true,
      },
      // WebSocket 프록시 설정
      '/ws-translation': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // WebSocket 지원 활성화
      },
    },
  },
})
