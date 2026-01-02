import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://lab404electronics.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/account/',
                    '/checkout/',
                    '/api/',
                    '/login',
                    '/register',
                    '/_next/',
                    '/admin/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
