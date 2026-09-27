/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'kierke-tst.ams3.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'kauppa.kierratyskeskus.fi' },
    ],
  },
  async headers() {
    return [
      {
        source: '/((?!_next/|api/).*)',
        headers: [
          { key: 'CDN-Cache-Control', value: 'max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};
export default nextConfig;
