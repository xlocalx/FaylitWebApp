import FaylitFrame from '@/components/faylit-frame';
import type { Metadata } from 'next';

interface DynamicPageProps {
  params: {
    slug: string[];
  };
}

function generatePageTitle(pathSegments: string[]): string {
  if (!pathSegments || pathSegments.length === 0) {
    return 'Faylit Store';
  }
  const titlePath = pathSegments
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/-/g, ' '))
    .join(' | ');
  return `Faylit Store - ${titlePath}`;
}

export async function generateMetadata({ params }: DynamicPageProps): Promise<Metadata> {
  const title = generatePageTitle(params.slug);
  const descriptionPath = params.slug.join('/');
  return {
    title,
    description: `Browse ${descriptionPath || 'the homepage'} on Faylit Store.`,
  };
}

export default function DynamicFaylitPage({ params }: DynamicPageProps) {
  const initialPath = params.slug.join('/');
  return <FaylitFrame initialPath={initialPath} />;
}
