/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'kierke-tst.ams3.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'kauppa.kierratyskeskus.fi' },
    ],
  },
};
export default nextConfig;
