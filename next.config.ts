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
    optimizePackageImports: [
      'lucide-react', 
      'date-fns', 
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Don't bundle Node.js packages for client
  serverExternalPackages: ['postgres'],
  
  // Turbopack configuration (Next.js 16+)
  turbopack: {},
};

export default nextConfig;
