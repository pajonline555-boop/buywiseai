import { use } from 'react';
import { findProductBySlug, TOP_CATEGORIES, DYNAMIC_PARTNER_PRODUCTS } from '@/lib/categoryData';
import { generateProductMetadata } from '@/lib/seo/productSeo';
import ProductIntelligenceClientContainer from '@/components/product/ProductIntelligenceClientContainer';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const allProducts = [
    ...TOP_CATEGORIES.flatMap(c => c.products),
    ...DYNAMIC_PARTNER_PRODUCTS
  ];
  return allProducts.map(product => ({
    slug: product.slug || product.id,
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = findProductBySlug(resolvedParams.slug);
  if (!product) {
    return { title: 'Product Intelligence — BuyWise AI' };
  }
  return generateProductMetadata(product);
}

export default function ProductIntelligencePage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const initialProduct = findProductBySlug(resolvedParams.slug);

  return (
    <ProductIntelligenceClientContainer
      slug={resolvedParams.slug}
      initialProduct={initialProduct}
    />
  );
}
