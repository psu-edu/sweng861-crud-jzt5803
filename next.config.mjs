/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sequelize', 'sqlite3'],
  output: 'standalone',
};

export default nextConfig;
