
import FaylitFrame from '../../components/faylit-frame.tsx'; // Changed to relative path
import type { Metadata } from 'next';

interface DynamicPageProps {
  params: {
    slug: string[];
  };
}

function generatePageSpecificTitle(pathSegments: string[]): string {
  if (!pathSegments || pathSegments.length === 0) {
    return 'Kategoriler';
  }
  const titlePath = pathSegments
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/-/g, ' '))
    .join(' | ');
  return titlePath;
}

export async function generateMetadata({ params }: DynamicPageProps): Promise<Metadata> {
  const pageSpecificTitle = generatePageSpecificTitle(params.slug);
  const descriptionPath = params.slug.join('/');

  return {
    title: pageSpecificTitle,
    description: `Faylit E-Mağaza'da ${descriptionPath || 'en yeni sokak modası'} ürünlerini keşfedin. ${pageSpecificTitle} koleksiyonumuzu inceleyin.`,
  };
}

export default function DynamicFaylitPage({ params }: DynamicPageProps) {
  const initialPath = params.slug.join('/');
  return <FaylitFrame initialPath={initialPath} />;
}
