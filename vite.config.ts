/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'child_process'

function getGitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

// base: './' + singlefile => one self-contained index.html that runs from file://
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_HASH__: JSON.stringify(getGitHash()),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
