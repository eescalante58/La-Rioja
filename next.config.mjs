/** @type {import('next').NextConfig} */
const nextConfig = {
  /** /contact se renombró a /apoyanos (página de donaciones). */
  async redirects() {
    return [{ source: "/contact", destination: "/apoyanos", permanent: true }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wfkqsifhxnarmxrvbgiu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
