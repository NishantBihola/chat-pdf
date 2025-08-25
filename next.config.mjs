/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // replace old `images.domains` with this
    remotePatterns: [
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};
export default nextConfig;
