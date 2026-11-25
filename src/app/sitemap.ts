import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://allrenthoteles.cl'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/reservar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/mi-reserva`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
