import { use } from 'react';
import { findProductBySlug, TOP_CATEGORIES, DYNAMIC_PARTNER_PRODUCTS } from '@/lib/categoryData';
import { MOCK_PARTNER_PRODUCTS, mapPartnerProductToBestsellerProduct } from '@/lib/partners/partnerService';
import { generateProductMetadata } from '@/lib/seo/productSeo';
import ProductIntelligenceClientContainer from '@/components/product/ProductIntelligenceClientContainer';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const partnerBestsellers = MOCK_PARTNER_PRODUCTS.map(mapPartnerProductToBestsellerProduct);
  const allProducts = [
    ...TOP_CATEGORIES.flatMap(c => c.products),
    ...DYNAMIC_PARTNER_PRODUCTS,
    ...partnerBestsellers
  ];
  const slugSet = new Set<string>();
  allProducts.forEach(product => {
    if (product.slug) slugSet.add(product.slug);
    if (product.id) slugSet.add(product.id);
  });
  return Array.from(slugSet).map(slug => ({ slug }));
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
