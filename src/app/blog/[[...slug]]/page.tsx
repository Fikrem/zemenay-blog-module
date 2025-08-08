import { BlogModule } from '@/components/BlogModule';

type BlogParams = { slug?: string[] };

type Props = { params?: BlogParams };

export default function BlogPage(props: unknown) {
  const { params } = (props as Props) ?? {};
  return <BlogModule slug={params?.slug} />;
}