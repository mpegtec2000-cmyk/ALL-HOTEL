import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://allrenthoteles.cl'
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/registro`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]
}
