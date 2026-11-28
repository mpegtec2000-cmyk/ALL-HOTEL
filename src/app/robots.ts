import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://allrenthoteles.cl'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/reservar', '/registro'],
        disallow: ['/admin', '/mi-reserva', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
