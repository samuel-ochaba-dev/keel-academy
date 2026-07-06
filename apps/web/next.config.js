/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/config", "@repo/content", "@repo/email"],
};

export default nextConfig;
