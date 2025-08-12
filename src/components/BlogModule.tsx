"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import MarkdownIt from "markdown-it";
import { UserAuth } from "./UserAuth";

// ===== MARKDOWN CONFIGURATION =====
const md = new MarkdownIt({
  html: true, // Allow HTML tags
  linkify: true,
  typographer: true,
});

// ===== INTERFACES =====
interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  author_name?: string;
  cover_image_url?: string;
  content_blocks?: ContentBlock[];
  likes_count?: number;
  dislikes_count?: number;
  comments_count?: number;
}

interface ContentBlock {
  type: "text" | "image" | "video";
  content: string;
  order: number;
  metadata?: {
    alt?: string;
    caption?: string;
    url?: string;
  };
}

interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
  user_id?: string;
}

interface UserReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
  created_at: string;
}

// ===== COMMENT COMPONENT =====
function CommentSection({ postId, user }: { postId: string; user: any }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState(user?.user_metadata?.name || "");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data || []);
      }
      setLoading(false);
    };

    fetchComments();
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    setSubmitting(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_name: authorName,
        content: newComment.trim(),
        user_id: user?.id || null,
      });

      if (error) {
        console.error("Error adding comment:", error);
        alert("Error adding comment: " + error.message);
      } else {
        setNewComment("");
        // Refresh comments
        const { data, error: fetchError } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: false });

        if (!fetchError) {
          setComments(data || []);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-2xl font-semibold mb-6">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {!user ? (
        <div className="mb-8 p-4  border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Please sign in to leave a comment.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="authorName"
                className="block text-sm font-medium mb-2"
              >
                Name
              </label>
              <input
                id="authorName"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium mb-2"
              >
                Comment
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4  rounded w-1/4 mb-2"></div>
              <div className="h-4  rounded w-full mb-2"></div>
              <div className="h-4  rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900">
                  {comment.author_name}
                </span>
                <span className="text-gray-500 text-sm">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== REACTION COMPONENT =====
function ReactionButtons({
  postId,
  initialLikes = 0,
  initialDislikes = 0,
}: {
  postId: string;
  initialLikes?: number;
  initialDislikes?: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Check user's existing reaction
  useEffect(() => {
    const checkUserReaction = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("user_reactions")
          .select("reaction_type")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          setUserReaction(data.reaction_type);
        }
      }
    };

    checkUserReaction();
  }, [postId]);

  const handleReaction = async (reactionType: "like" | "dislike") => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please sign in to react to posts");
        return;
      }

      // Remove existing reaction if same type
      if (userReaction === reactionType) {
        const { error } = await supabase
          .from("user_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", reactionType);

        if (!error) {
          setUserReaction(null);
          if (reactionType === "like") {
            setLikes((prev) => Math.max(0, prev - 1));
          } else {
            setDislikes((prev) => Math.max(0, prev - 1));
          }
        }
        return;
      }

      // Remove opposite reaction if exists
      if (userReaction && userReaction !== reactionType) {
        await supabase
          .from("user_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .eq("reaction_type", userReaction);

        if (userReaction === "like") {
          setLikes((prev) => Math.max(0, prev - 1));
        } else {
          setDislikes((prev) => Math.max(0, prev - 1));
        }
      }

      // Add new reaction
      const { error } = await supabase.from("user_reactions").insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType,
      });

      if (!error) {
        setUserReaction(reactionType);
        if (reactionType === "like") {
          setLikes((prev) => prev + 1);
        } else {
          setDislikes((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
      alert("Error updating reaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => handleReaction("like")}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
          userReaction === "like"
            ? "bg-green-100 text-green-700 border border-green-300"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Like ({likes})
      </button>

      <button
        onClick={() => handleReaction("dislike")}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
          userReaction === "dislike"
            ? "bg-red-100 text-red-700 border border-red-300"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Dislike ({dislikes})
      </button>
    </div>
  );
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

export function BlogModule({
  slug,
  topOffset = 0,
  showHeader = true,
}: {
  slug?: string[];
  topOffset?: number | string;
  showHeader?: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
    const youtubeRegex =
      /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
    return content.replace(youtubeRegex, (match, p1, p2, videoId) => {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    });
  };

  // Single post rendering
  if (slug && post) {
    const processedContent = convertVideoUrls(post.content);
    return (
      <div
        className="min-h-screen bg-white "
        style={{
          paddingTop:
            typeof topOffset === "number"
              ? `${topOffset}px`
              : (topOffset as string),
        }}
      >
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header with Auth */}
            {showHeader && (
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">welcome to the Blog</h1>
                <div className="flex items-center gap-4">
                  <UserAuth onAuthChange={setUser} user={user} />
                </div>
              </div>
            )}
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
            <ReactionButtons
              postId={post.id}
              initialLikes={post.likes_count || 0}
              initialDislikes={post.dislikes_count || 0}
            />
            <CommentSection postId={post.id} user={user} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        paddingTop:
          typeof topOffset === "number"
            ? `${topOffset}px`
            : (topOffset as string),
      }}
    >
      <div className="container mx-auto p-4">
        {/* Header with Auth */}
        {showHeader && (
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">welcome to the Blog</h1>
            <div className="flex items-center gap-4">
              <UserAuth onAuthChange={setUser} user={user} />
            </div>
          </div>
        )}
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
                <p className="text-gray-700 mb-3">
                  {getExcerpt(post.content, 30)}
                </p>

                {/* Reaction and Comment Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {post.dislikes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    {post.comments_count || 0}
                  </span>
                </div>

                <span className="text-blue-500 hover:underline text-sm">
                  Read more →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
