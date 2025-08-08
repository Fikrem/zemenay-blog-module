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

// New interfaces for reactions and comments
type ReactionType = 'like' | 'dislike';

interface PostReactionCounts {
  like: number;
  dislike: number;
}

interface UserReaction {
  reaction: ReactionType | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  author_email: string | null;
  content: string;
  created_at: string;
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

  // Reactions state
  const [counts, setCounts] = useState<PostReactionCounts>({ like: 0, dislike: 0 });
  const [userReaction, setUserReaction] = useState<UserReaction>({ reaction: null });
  const [reacting, setReacting] = useState(false);

  // Comments state
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionEmail(data.session?.user?.email ?? null);
    };
    fetchSession();
  }, []);

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

  // Fetch reactions and comments when we have a post
  useEffect(() => {
    if (!post?.id) return;

    const loadReactions = async () => {
      // counts
      const { data: likeCountData } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('reaction', 'like');
      const { data: dislikeCountData } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('reaction', 'dislike');

      const likeCount = Array.isArray(likeCountData) ? likeCountData.length : 0;
      const dislikeCount = Array.isArray(dislikeCountData) ? dislikeCountData.length : 0;
      setCounts({ like: likeCount, dislike: dislikeCount });

      // user reaction
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      if (userId) {
        const { data: ur } = await supabase
          .from('post_reactions')
          .select('reaction')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle();
        setUserReaction({ reaction: (ur?.reaction as ReactionType) ?? null });
      } else {
        setUserReaction({ reaction: null });
      }
    };

    const loadComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
      if (!error && data) setComments(data as CommentRow[]);
    };

    loadReactions();
    loadComments();
  }, [post?.id]);

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

// Reaction handlers
const handleReaction = async (reaction: ReactionType) => {
  if (!post?.id) return;
  setReacting(true);
  try {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user) {
      // redirect to sign-in with redirect back to current post
      window.location.href = `/auth/signin?redirect=/blog/${post.slug}`;
      return;
    }

    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id, reaction')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      // insert new
      const { error } = await supabase.from('post_reactions').insert({
        post_id: post.id,
        user_id: user.id,
        reaction,
      });
      if (error) console.error(error);
    } else if (existing.reaction === reaction) {
      // toggle off -> delete
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', (existing as { id: string }).id);
      if (error) console.error(error);
    } else {
      // update to new reaction
      const { error } = await supabase
        .from('post_reactions')
        .update({ reaction })
        .eq('id', (existing as { id: string }).id);
      if (error) console.error(error);
    }

    // reload counts and user reaction
    const { data: likeCountData } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('reaction', 'like');
    const { data: dislikeCountData } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('reaction', 'dislike');

    const likeCount = Array.isArray(likeCountData) ? likeCountData.length : 0;
    const dislikeCount = Array.isArray(dislikeCountData) ? dislikeCountData.length : 0;
    setCounts({ like: likeCount, dislike: dislikeCount });

    const { data: ur } = await supabase
      .from('post_reactions')
      .select('reaction')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setUserReaction({ reaction: (ur?.reaction as ReactionType) ?? null });
  } finally {
    setReacting(false);
  }
};

// Comments handler
const submitComment = async () => {
  if (!post?.id || !newComment.trim()) return;
  setCommentSubmitting(true);
  try {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user) {
      window.location.href = `/auth/signin?redirect=/blog/${post.slug}`;
      return;
    }

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      author_id: user.id,
      author_email: user.email,
      content: newComment.trim(),
    });
    if (error) {
      console.error(error);
    } else {
      setNewComment('');
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
      if (data) setComments(data as CommentRow[]);
    }
  } finally {
    setCommentSubmitting(false);
  }
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

        {/* Reactions */}
        <div className="mt-10 flex items-center gap-4">
          <button
            disabled={reacting}
            onClick={() => handleReaction('like')}
            className={`px-4 py-2 rounded border ${userReaction.reaction === 'like' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} `}
          >
            👍 Like ({counts.like})
          </button>
          <button
            disabled={reacting}
            onClick={() => handleReaction('dislike')}
            className={`px-4 py-2 rounded border ${userReaction.reaction === 'dislike' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'} `}
          >
            👎 Dislike ({counts.dislike})
          </button>
        </div>

        {/* Comments */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Comments</h2>

          {sessionEmail ? (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-500">Signed in as {sessionEmail}</span>
                <button
                  onClick={submitComment}
                  disabled={commentSubmitting || !newComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {commentSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-sm text-gray-600">
              <a className="text-blue-600 hover:underline" href={`/auth/signin?redirect=/blog/${post.slug}`}>Sign in</a> or <a className="text-blue-600 hover:underline" href={`/auth/signin?mode=signup&redirect=/blog/${post.slug}`}>sign up</a> to comment.
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">
                    {c.author_email || 'Unknown user'} • {new Date(c.created_at).toLocaleString()}
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">{c.content}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
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
