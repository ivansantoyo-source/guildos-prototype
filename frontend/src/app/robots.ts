import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/[tenant]/'],
    },
    sitemap: 'https://guildos.com/sitemap.xml',
  };
}
