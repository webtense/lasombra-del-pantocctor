import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import TrackPageView from '@/components/TrackPageView'
import BottomNav from '@/components/BottomNav'
import { GA_MEASUREMENT_ID } from '@/lib/gtag'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'La Sombra del Pantocrátor — Andrés Sánchez Serrano',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  description:
    'Bruno Martí llega a la Vall de Boí siguiendo una pista imposible: una nota con tres nombres y el de un hotel que no debería existir. Ebook + Audiolibro (8h 11min) por 12,99 €. Un thriller tecnológico de Andrés Sánchez Serrano.',
  keywords: ['thriller tecnológico', 'novela negra', 'Vall de Boí', 'libro', 'audiolibro'],
  authors: [{ name: 'Andrés Sánchez Serrano' }],
  openGraph: {
    title: 'La Sombra del Pantocrátor',
    description: 'Un thriller tecnológico. Bajo la nieve, el románico y la piedra se esconde el Pantocrátor.',
    type: 'book',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Sombra del Pantocrátor',
    description: 'Un thriller tecnológico de Andrés Sánchez Serrano.',
  },
  // Verificación de propiedad en Google Search Console — NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // (contenido del meta tag que da Search Console al añadir la propiedad por "etiqueta HTML").
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#050810] text-gray-200 font-sans min-h-screen flex flex-col">
        {/* Google Analytics 4 — solo se carga si hay Measurement ID configurado */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
                window.gtag = gtag;
              `}
            </Script>
          </>
        )}
        <TrackPageView />
        <NavBar />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  )
}
