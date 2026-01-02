import { MetadataRoute } from 'next';

const BASE_URL = 'https://lab404electronics.com';

// In production, these would be fetched from your API/database
async function getProducts() {
    // Mock data - replace with actual API call
    return [
        { slug: 'arduino-uno', updatedAt: new Date() },
        { slug: 'raspberry-pi-4', updatedAt: new Date() },
        { slug: 'dht22-sensor', updatedAt: new Date() },
    ];
}

async function getBlogPosts() {
    // Mock data - replace with actual API call
    return [
        { slug: 'getting-started-with-arduino', updatedAt: new Date() },
        { slug: 'best-sensors-for-iot', updatedAt: new Date() },
    ];
}

async function getCategories() {
    // Mock data - replace with actual API call
    return [
        { slug: 'sensors' },
        { slug: 'microcontrollers' },
        { slug: 'components' },
        { slug: 'kits' },
    ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/order-tracking`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/shipping`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/returns`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // Dynamic product pages
    const products = await getProducts();
    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    // Dynamic blog posts
    const blogPosts = await getBlogPosts();
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    // Category pages
    const categories = await getCategories();
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${BASE_URL}/products?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...blogPages, ...categoryPages];
}
