import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // host: true cho phép truy cập dev server từ thiết bị khác cùng mạng LAN
  // (vd điện thoại thật) qua địa chỉ IP máy, không chỉ localhost.
  server: {
    host: true,
  },
})
