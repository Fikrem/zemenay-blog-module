'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
}

export function BlogModule({ slug }: { slug?: string[] }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      if (!slug) {
        const { data, error } = await supabase.from('posts').select('*');
        if (error) console.error('Error fetching posts:', error);
        else setPosts(data || []);
      } else {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug[0])
          .single();
        if (error) console.error('Error fetching post:', error);
        else setPost(data || null);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [slug]);

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;

  if (slug && post) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div
          className="prose mt-4"
          dangerouslySetInnerHTML={{ __html: md.render(post.content) }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Blog</h1>
      <ul className="list-disc pl-5 mt-4">
        {posts.map((post) => (
          <li key={post.id}>
            <a href={`/blog/${post.slug}`} className="text-blue-500 hover:underline">
              {post.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}