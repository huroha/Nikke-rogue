import { defineConfig } from 'vite';

export default defineConfig({
  // 상대 경로로 빌드해서 GitHub Pages 하위 경로(/Nikke-rogue/)에서도 동작하게 한다.
  base: './',
  // Phaser 자체가 1MB 남짓이라 경고 기준을 올려 둔다.
  build: { chunkSizeWarningLimit: 1600 },
});
