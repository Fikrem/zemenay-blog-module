'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import MarkdownIt from 'markdown-it';
import { useMemo } from "react";
// ... existing code ...

// ... existing code ...
// In BlogModule.tsx, update the markdown-it configuration
const md = new MarkdownIt({
  html: true, // Allow HTML tags
  linkify: true,
  typographer: true
});

// Replace the existing Post interface (around line 8-15)
interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  author_name?: string;
  cover_image_url?: string;
  content_blocks?: ContentBlock[];
}

interface ContentBlock {
  type: 'text' | 'image' | 'video';
  content: string;
  order: number;
  metadata?: {
    alt?: string;
    caption?: string;
    url?: string;
  };
}

// Skeleton loader component
function BlogSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

export function BlogModule({ slug }: { slug?: string[] }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      if (!slug) {
        const { data, error } = await supabase.from("posts").select("*");
        if (error) console.error("Error fetching posts:", error);
        else setPosts(data || []);
      } else {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("slug", slug[0])
          .single();
        if (error) console.error("Error fetching post:", error);
        else setPost(data || null);
      }
      setLoading(false);
    };
    fetchPosts();
  }, [slug]);

  // Helper to get excerpt from content
  const getExcerpt = (content: string, length = 30) => {
    const words = content.split(/\s+/);
    return words.length > length
      ? words.slice(0, length).join(" ") + "..."
      : content;
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) return <BlogSkeleton />;
// Replace the existing single post return statement

// Add this function to convert YouTube URLs to embedded players
const convertVideoUrls = (content: string) => {
  // Convert YouTube URLs to embedded players
  const youtubeRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
  return content.replace(youtubeRegex, (match, p1, p2, videoId) => {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  });
};

// Then in your single post rendering, update the content before rendering:
if (slug && post) {
  const processedContent = convertVideoUrls(post.content);
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {post.cover_image_url && (
          <img 
            src={post.cover_image_url} 
            alt={post.title}
            className="w-full h-64 object-cover rounded-lg mb-8"
          />
        )}
        <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
        <div className="flex items-center text-gray-500 text-sm mb-6">
          <span>{formatDate(post.created_at)}</span>
          {post.author_name && (
            <>
              <span className="mx-2">•</span>
              <span>By {post.author_name}</span>
            </>
          )}
        </div>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: md.render(processedContent) }}
        />
      </div>
    </div>
  );
}

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    
{posts.map((post) => (
  <a
    key={post.id}
    href={`/blog/${post.slug}`}
    className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border border-gray-100 hover:border-blue-400 overflow-hidden"
  >
    {post.cover_image_url && (
      <img 
        src={post.cover_image_url} 
        alt={post.title}
        className="w-full h-48 object-cover"
      />
    )}
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2 text-blue-700 hover:underline">
        {post.title}
      </h2>
      <div className="text-gray-500 text-xs mb-2 flex items-center">
        <span>{formatDate(post.created_at)}</span>
        {post.author_name && (
          <>
            <span className="mx-2">•</span>
            <span>By {post.author_name}</span>
          </>
        )}
      </div>
      <p className="text-gray-700 mb-2">
        {getExcerpt(post.content, 30)}
      </p>
      <span className="text-blue-500 hover:underline text-sm">
        Read more →
      </span>
    </div>
  </a>
))}
      </div>
    </div>
  );
}
