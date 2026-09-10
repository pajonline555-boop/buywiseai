import { Metadata } from 'next';
import { BestsellerProduct } from '../categoryData';

export function isIndexableProduct(product?: BestsellerProduct | null): boolean {
  if (!product) return false;

  // Quality Gate criteria for indexable BuyWise Product Intelligence Page
  const hasTitle = Boolean(product.name && product.name.trim().length > 3);
  const hasImage = Boolean(product.image && product.image.trim().startsWith('http'));
  const hasValidPrice = Boolean(product.lowestPrice && product.lowestPrice > 0);
  const hasSpecs = Boolean(product.specs && product.specs.length >= 2);
  const hasRating = Boolean(product.rating && product.rating > 0);

  return hasTitle && hasImage && hasValidPrice && hasSpecs && hasRating;
}

export function generateProductMetadata(product: BestsellerProduct, origin: string = 'https://buywiseai.pajonline.co.in'): Metadata {
  const indexable = isIndexableProduct(product);
  const slug = product.slug || product.id;
  const canonicalUrl = `${origin}/product/${encodeURIComponent(slug)}`;
  const title = `${product.name} — Best Price & BuyWise Intelligence`;
  const description = `BuyWise AI Price Intelligence for ${product.name}: Best live price ₹${product.lowestPrice.toLocaleString()} on ${product.bestStore}. Smart Value Score & 3D Try-On.`;

  return {
    title,
    description,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'BuyWise AI',
      images: [
        {
          url: product.image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image],
    },
  };
}

export function generateProductJsonLd(product: BestsellerProduct, origin: string = 'https://buywiseai.pajonline.co.in') {
  const slug = product.slug || product.id;
  const canonicalUrl = `${origin}/product/${encodeURIComponent(slug)}`;

  const offers = (product.prices || []).map(p => ({
    '@type': 'Offer',
    name: p.store,
    price: p.price,
    priceCurrency: 'INR',
    availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: p.url.startsWith('http') ? p.url : `${origin}${p.url}`,
    seller: {
      '@type': 'Organization',
      name: p.store
    }
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image],
    description: `BuyWise AI Intelligence analysis for ${product.name}. Smart Value Score & live price comparison across 14 stores in India.`,
    category: product.category,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating || 4.8,
      reviewCount: product.reviewsCount || 100,
      bestRating: '5',
      worstRating: '1',
    },
    offers: offers.length > 0 ? offers : {
      '@type': 'Offer',
      price: product.lowestPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    },
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: origin,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category,
        item: `${origin}/categories`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return { jsonLd, breadcrumbsJsonLd };
}
