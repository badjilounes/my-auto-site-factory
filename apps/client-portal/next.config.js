/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@my-auto-site-factory/shared-ui',
    '@my-auto-site-factory/shared-types',
    '@my-auto-site-factory/client-billing',
  ],
};
module.exports = nextConfig;
