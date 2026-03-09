/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    // Enable React Server Components
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
