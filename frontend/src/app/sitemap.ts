import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://guildos.com';
  const lastModified = new Date();

  const routes = [
    { url: '', priority: 1.0 },
    { url: '/login', priority: 0.9 },
    { url: '/dashboard', priority: 0.8 },
    { url: '/inventory', priority: 0.7 },
    { url: '/bounty-board', priority: 0.7 },
    { url: '/nexus', priority: 0.7 },
    { url: '/shopkeeper', priority: 0.6 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: route.priority,
  }));
}
