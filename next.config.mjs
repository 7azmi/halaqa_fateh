/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // For GitHub Pages project site: set NEXT_PUBLIC_BASE_PATH to /repo-name
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig