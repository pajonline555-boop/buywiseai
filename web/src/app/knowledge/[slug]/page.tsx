import { use } from 'react';
import { KNOWLEDGE_ARTICLES, getArticleBySlug } from '@/lib/knowledge/store';
import SingleKnowledgeArticleClientContainer from '@/components/knowledge/SingleKnowledgeArticleClientContainer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const article = getArticleBySlug(resolvedParams.slug);
  if (!article) {
    return {
      title: 'Shopping Knowledge Hub — BuyWise AI',
    };
  }
  return {
    title: `${article.title} — BuyWise AI Shopping Education`,
    description: article.excerpt,
  };
}

export default function SingleKnowledgeArticlePage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <SingleKnowledgeArticleClientContainer slug={resolvedParams.slug} />;
}
