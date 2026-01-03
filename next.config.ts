import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'inspektorat.bintankab.go.id',
        pathname: '/wp-content/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
  
  // Strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize for production
  poweredByHeader: false,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
};

export default nextConfig;
