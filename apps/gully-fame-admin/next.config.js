
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  async rewrites() {
    return [
      {
        source: '/v1/api/:path*',
        destination: 'https://backend.gullyfame.com/v1/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig