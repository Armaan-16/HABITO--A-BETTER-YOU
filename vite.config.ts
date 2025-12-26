import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize env var from loadEnv, then process.env (for Netlify/CI)
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so the code works without changes
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})