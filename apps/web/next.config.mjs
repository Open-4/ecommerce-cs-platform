/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@ecs/shared"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
