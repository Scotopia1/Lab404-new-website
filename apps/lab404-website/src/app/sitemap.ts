import { MetadataRoute } from 'next';
import axios from 'axios';

const BASE_URL = 'https://lab404electronics.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Fetch actual products from API
async function getProducts() {
    try {
        const response = await axios.get(`${API_URL}/products`, {
            params: { limit: 1000 }, // Get all products
        });
        return response.data.data.map((product: any) => ({
            slug: product.slug,
            updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        }));
    } catch (error) {
        console.error('Error fetching products for sitemap:', error);
        return [];
    }
}

// Fetch actual blog posts from API
async function getBlogPosts() {
    try {
        const response = await axios.get(`${API_URL}/blogs`, {
            params: { limit: 1000 }, // Get all blogs
        });
        return response.data.data.map((blog: any) => ({
            slug: blog.slug,
            updatedAt: blog.publishedAt ? new Date(blog.publishedAt) : new Date(),
        }));
    } catch (error) {
        console.error('Error fetching blogs for sitemap:', error);
        return [];
    }
}

// Fetch categories from API
async function getCategories() {
    try {
        const response = await axios.get(`${API_URL}/categories`);
        return response.data.data.map((category: any) => ({
            slug: category.slug,
        }));
    } catch (error) {
        console.error('Error fetching categories for sitemap:', error);
        return [];
    }
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
    const productPages: MetadataRoute.Sitemap = products.map((product: { slug: string; updatedAt: Date }) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Dynamic blog posts
    const blogPosts = await getBlogPosts();
    const blogPages: MetadataRoute.Sitemap = blogPosts.map((post: { slug: string; updatedAt: Date }) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    // Category pages
    const categories = await getCategories();
    const categoryPages: MetadataRoute.Sitemap = categories.map((category: { slug: string }) => ({
        url: `${BASE_URL}/products?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...blogPages, ...categoryPages];
}
