/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
    hostname: process.env.HOSTNAME || '0.0.0.0',
  },
  publicRuntimeConfig: {
    // Can be read on both server and client
  },
}

module.exports = nextConfig
