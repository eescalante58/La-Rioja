/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  /**
   * Redirección canónica de www al dominio principal (preserva ruta y query params);
   * /contact se renombró a /apoyanos (página de donaciones); /inicio redirige al home.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.lariojacflsv.site" }],
        destination: "https://lariojacflsv.site/:path*",
        permanent: true,
      },
      { source: "/contact", destination: "/apoyanos", permanent: true },
      { source: "/inicio", destination: "/", permanent: true },
    ];
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
