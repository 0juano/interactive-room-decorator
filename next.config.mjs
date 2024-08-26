/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    FAL_KEY: process.env.FAL_KEY,
  },
  images: {
    domains: ['fal-cdn.fal.ai'],
  },
};

export default nextConfig;