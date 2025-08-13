"use client"
import { BlogModule } from '@/components/BlogModule';

export default function BlogPage({ params }: { params: { slug?: string[] } }) {
  return <BlogModule showHeader={true} topOffset={64}  slug={params.slug}  />;
}