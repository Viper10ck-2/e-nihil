import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: {
    default: "e-Nihil Bintan | Layanan SKBT Online Inspektorat Kabupaten Bintan",
    template: "%s | e-Nihil Bintan"
  },
  description: "e-Nihil adalah layanan penerbitan Surat Keterangan Bebas Temuan (SKBT) online dari Inspektorat Daerah Kabupaten Bintan. Ajukan permohonan SKBT untuk mutasi, promosi jabatan secara gratis, cepat, dan transparan.",
  keywords: [
    "e-nihil",
    "e-nihil bintan",
    "SKBT",
    "Surat Keterangan Bebas Temuan",
    "Inspektorat Bintan",
    "Inspektorat Kabupaten Bintan",
    "layanan SKBT online",
    "bebas temuan bintan",
    "mutasi ASN bintan",
    "promosi jabatan bintan",
    "layanan inspektorat bintan",
    "surat bebas temuan",
    "kepulauan riau",
    "pemerintah kabupaten bintan"
  ],
  authors: [{ name: "Inspektorat Daerah Kabupaten Bintan" }],
  creator: "Inspektorat Daerah Kabupaten Bintan",
  publisher: "Pemerintah Kabupaten Bintan",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://e-nihil.vercel.app',
    siteName: 'e-Nihil Bintan',
    title: 'e-Nihil Bintan | Layanan SKBT Online Inspektorat Kabupaten Bintan',
    description: 'Layanan penerbitan Surat Keterangan Bebas Temuan (SKBT) online dari Inspektorat Daerah Kabupaten Bintan. Gratis, cepat, dan transparan.',
    images: [
      {
        url: '/logo-bintan.png',
        width: 512,
        height: 512,
        alt: 'Logo e-Nihil Bintan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'e-Nihil Bintan | Layanan SKBT Online',
    description: 'Layanan penerbitan Surat Keterangan Bebas Temuan (SKBT) online dari Inspektorat Daerah Kabupaten Bintan.',
    images: ['/logo-bintan.png'],
  },
  alternates: {
    canonical: 'https://e-nihil.vercel.app',
  },
  icons: {
    icon: '/logo-bintan.png',
    shortcut: '/logo-bintan.png',
    apple: '/logo-bintan.png',
  },
  category: 'government',
  classification: 'Government Services',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'e-Nihil Bintan',
    description: 'Layanan penerbitan Surat Keterangan Bebas Temuan (SKBT) online dari Inspektorat Daerah Kabupaten Bintan',
    serviceType: 'Surat Keterangan Bebas Temuan',
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Inspektorat Daerah Kabupaten Bintan',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Jl. Bintan Buyu',
        addressLocality: 'Bandar Seri Bentan',
        addressRegion: 'Kepulauan Riau',
        addressCountry: 'ID'
      }
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Kabupaten Bintan'
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://e-nihil.vercel.app/pengajuan',
      serviceType: 'Online'
    },
    isRelatedTo: {
      '@type': 'GovernmentService',
      name: 'Mutasi ASN',
      description: 'Layanan perpindahan Aparatur Sipil Negara antar instansi'
    }
  };

  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
