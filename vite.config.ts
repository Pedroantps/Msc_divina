import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Worktrees de agentes em .claude/worktrees não devem disparar recarga no servidor de dev.
  server: { watch: { ignored: ['**/.claude/**'] } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    // Worktrees de agentes ficam em .claude/worktrees: não rodar os testes deles aqui.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
})
