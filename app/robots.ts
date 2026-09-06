import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://la-sombra-del-pantocrator.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/tester', '/escuchar'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
