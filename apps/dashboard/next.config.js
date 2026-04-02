/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@my-auto-site-factory/shared-ui',
    '@my-auto-site-factory/shared-types',
    '@my-auto-site-factory/prospect-management',
    '@my-auto-site-factory/site-generation',
  ],
};
module.exports = nextConfig;
