/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
  experimental: {
    // Enable React Server Components
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
