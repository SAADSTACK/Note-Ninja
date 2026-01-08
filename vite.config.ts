
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This permanently sets the API key in the code during the build process
    'process.env.API_KEY': JSON.stringify('AIzaSyBdbAl-z9UJqSPa-cB3HDHdLHV1r4X341o')
  },
  server: {
    port: 3000
  }
});
