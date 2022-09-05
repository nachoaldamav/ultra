/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { buildId, dev }) => {
    config.resolve.symlinks = false;
    return config;
  },
};

module.exports = nextConfig;
