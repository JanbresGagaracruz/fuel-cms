/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  // Allow large file uploads (50 MB body size)
  api: {
    bodyParser: {
      sizeLimit: '52mb',
    },
    responseLimit: '52mb',
  },
}

module.exports = nextConfig
