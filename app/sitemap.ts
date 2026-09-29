import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://la-sombra-del-pantocrator.vercel.app'
  const now = new Date()

  const routes = ['', '/resumen', '/personajes', '/muestra', '/descargar', '/gracias']

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/descargar' ? 0.9 : 0.7,
  }))
}
