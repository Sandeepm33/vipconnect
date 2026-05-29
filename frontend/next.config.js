/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig = {
  output: isMobileBuild ? 'export' : undefined,
  images: {
    unoptimized: isMobileBuild ? true : false,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'vipconnect.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'vipconnect-862369801433-ap-southeast-2-an.s3.ap-southeast-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  // For PWA support in future
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
};

module.exports = nextConfig;
