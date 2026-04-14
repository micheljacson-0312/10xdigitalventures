/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chat.10xdigitalventures.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}
module.exports = nextConfig
