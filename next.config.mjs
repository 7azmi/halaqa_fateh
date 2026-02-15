/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable when Server Actions are replaced with client-side Sheets API (Phase 4/5)
  // output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig