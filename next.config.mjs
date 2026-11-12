/** @type {import('next').NextConfig} */
const nextConfig = {
  // English stays at "/"; the page itself is rendered by app/[locale].
  async rewrites() {
    return [
      { source: "/", destination: "/en" },
      { source: "/privacy", destination: "/en/privacy" },
      { source: "/support", destination: "/en/support" },
      { source: "/delete-account", destination: "/en/delete-account" },
    ];
  },
  async redirects() {
    return [{ source: "/en", destination: "/", permanent: true }];
  },
};

export default nextConfig;
