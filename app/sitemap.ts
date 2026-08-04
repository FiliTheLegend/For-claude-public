import type { MetadataRoute } from 'next';

const ROUTES = [
  '/',
  '/business-concept/',
  '/our-journey/',
  '/about-us/',
  '/for-buyers/',
  '/contact-us/',
];

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://lotussyndicate.com';
  return ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
