import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // Hostinger public_html is served as plain files: trailing slashes give us
  // /business-concept/index.html rather than requiring server rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['three'],
};

export default nextConfig;
