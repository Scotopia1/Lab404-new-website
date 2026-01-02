interface OrganizationJsonLdProps {
    name?: string;
    url?: string;
    logo?: string;
    sameAs?: string[];
}

export function OrganizationJsonLd({
    name = 'Lab404 Electronics',
    url = 'https://lab404electronics.com',
    logo = 'https://lab404electronics.com/logo.png',
    sameAs = [
        'https://facebook.com/lab404electronics',
        'https://twitter.com/lab404electronics',
        'https://instagram.com/lab404electronics',
        'https://youtube.com/lab404electronics',
    ],
}: OrganizationJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo,
        sameAs,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-404-1234',
            contactType: 'customer service',
            email: 'support@lab404electronics.com',
            availableLanguage: ['English'],
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: '123 Electronics Ave',
            addressLocality: 'Tech City',
            addressRegion: 'TC',
            postalCode: '12345',
            addressCountry: 'US',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

interface WebSiteJsonLdProps {
    name?: string;
    url?: string;
    description?: string;
}

export function WebSiteJsonLd({
    name = 'Lab404 Electronics',
    url = 'https://lab404electronics.com',
    description = 'Your one-stop shop for electronic components, sensors, and DIY kits.',
}: WebSiteJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name,
        url,
        description,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${url}/products?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

interface ProductJsonLdProps {
    name: string;
    description: string;
    image: string;
    sku: string;
    price: number;
    currency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    brand?: string;
    category?: string;
    rating?: {
        value: number;
        count: number;
    };
}

export function ProductJsonLd({
    name,
    description,
    image,
    sku,
    price,
    currency = 'USD',
    availability = 'InStock',
    brand = 'Lab404',
    category,
    rating,
}: ProductJsonLdProps) {
    const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        image,
        sku,
        brand: {
            '@type': 'Brand',
            name: brand,
        },
        offers: {
            '@type': 'Offer',
            url: `https://lab404electronics.com/products/${sku}`,
            priceCurrency: currency,
            price: price.toFixed(2),
            availability: `https://schema.org/${availability}`,
            seller: {
                '@type': 'Organization',
                name: 'Lab404 Electronics',
            },
        },
    };

    if (category) {
        jsonLd.category = category;
    }

    if (rating) {
        jsonLd.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: rating.value.toFixed(1),
            reviewCount: rating.count,
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

interface ArticleJsonLdProps {
    headline: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    slug: string;
}

export function ArticleJsonLd({
    headline,
    description,
    image,
    datePublished,
    dateModified,
    author = 'Lab404 Electronics',
    slug,
}: ArticleJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        description,
        image,
        datePublished,
        dateModified: dateModified || datePublished,
        author: {
            '@type': 'Organization',
            name: author,
            url: 'https://lab404electronics.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Lab404 Electronics',
            logo: {
                '@type': 'ImageObject',
                url: 'https://lab404electronics.com/logo.png',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://lab404electronics.com/blog/${slug}`,
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

interface BreadcrumbItem {
    name: string;
    href: string;
}

interface BreadcrumbJsonLdProps {
    items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `https://lab404electronics.com${item.href}`,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

interface FAQJsonLdProps {
    questions: Array<{
        question: string;
        answer: string;
    }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
