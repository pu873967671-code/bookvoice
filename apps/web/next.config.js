/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
