/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      turbo: false, // ✅ Force fallback to Webpack
    },
  };
  
  module.exports = nextConfig;
  