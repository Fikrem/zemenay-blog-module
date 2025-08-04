import { BlogModule } from '@/components/BlogModule';

export default function BlogPage({ params }: { params: { slug?: string[] } }) {
  return <BlogModule slug={params.slug} />;
}