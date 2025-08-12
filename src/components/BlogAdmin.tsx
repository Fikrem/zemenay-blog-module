"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

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

// ===== TOAST NOTIFICATION COMPONENT =====
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right`}
    >
      {message}
    </div>
  );
}

// ===== IMAGE UPLOAD COMPONENT =====
function ImageUpload({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image: " + error.message);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      onChange(publicUrl);
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700  mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {uploading ? (
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
          {uploading ? "Uploading..." : "Upload Image"}
        </label>
        {value && (
          <div className="flex items-center gap-2">
            <img
              src={value}
              alt="Preview"
              className="w-16 h-16 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== RICH CONTENT EDITOR COMPONENT =====
function RichContentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (content: string) => void;
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const insertImage = () => {
    if (imageUrl) {
      const imageMarkdown = `\n![Image](${imageUrl})\n`;
      onChange(value + imageMarkdown);
      setImageUrl("");
      setShowImageModal(false);
    }
  };

  const insertVideo = () => {
    if (videoUrl) {
      // Check if it's a YouTube URL
      const youtubeRegex =
        /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = videoUrl.match(youtubeRegex);

      if (match) {
        // It's a YouTube URL, convert to embedded player
        const videoId = match[3];
        const videoMarkdown = `\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n`;
        onChange(value + videoMarkdown);
      } else {
        // Regular video URL
        const videoMarkdown = `\n<video controls>\n  <source src="${videoUrl}" type="video/mp4">\n  Your browser does not support the video tag.\n</video>\n`;
        onChange(value + videoMarkdown);
      }
      setVideoUrl("");
      setShowVideoModal(false);
    }
  };

  return (
    <div>
      {/* Rich Content Toolbar */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
        >
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Add Image
        </button>
        <button
          type="button"
          onClick={() => setShowVideoModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
        >
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Add Video
        </button>
      </div>

      {/* Content Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your blog post content here... Use the buttons above to add images and videos!"
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white border-gray-300 text-gray-900"
        rows={16}
      />

      {/* Image Insert Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Add Image
            </h3>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 bg-white text-gray-900"
            />
            <div className="flex gap-2">
              <button
                onClick={insertImage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Insert
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Insert Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Add Video
            </h3>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter video URL (YouTube or direct video link)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 bg-white text-gray-900"
            />
            <div className="flex gap-2">
              <button
                onClick={insertVideo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Insert
              </button>
              <button
                onClick={() => setShowVideoModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== SKELETON LOADER COMPONENT =====
function AdminSkeleton() {
  return (
    <div className="container mx-auto p-4 bg-white min-h-screen">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Form skeleton */}
        <div className="bg-gray-50 shadow-md rounded-lg p-6 border border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Posts list skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN BLOG ADMIN COMPONENT =====
export function BlogAdmin({
  topOffset = 0,
  showHeader = true,
}: {
  topOffset?: number | string;
  showHeader?: boolean;
} = {}) {
  // ===== STATE MANAGEMENT =====
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const router = useRouter();

  // ===== AUTO-GENERATE SLUG FROM TITLE =====
  useEffect(() => {
    if (title && !editingId) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  }, [title, editingId]);

  // ===== FETCH POSTS FUNCTION =====
  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching posts:", error);
      showToast("Error fetching posts", "error");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  // ===== TOAST NOTIFICATION HELPER =====
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  // ===== INITIAL DATA LOADING =====
  useEffect(() => {
    fetchPosts();
  }, []);

  // ===== FORM SUBMISSION HANDLER =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !slug || !authorName) return;

    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing post
        const postData = {
          title,
          content,
          slug,
          author_name: authorName,
          cover_image_url: coverImageUrl,
        };
        const { data, error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editingId)
          .select();
        console.log("Update response:", { data, error });
        if (error) {
          console.error("Error updating post:", error);
          showToast("Error updating post: " + error.message, "error");
        } else if (!data || data.length === 0) {
          showToast("No post was updated. Are you authenticated?", "error");
        } else {
          showToast("Post updated successfully!", "success");
        }
      } else {
        // Create new post
        const userResult = await supabase.auth.getUser();
        const user = userResult.data.user;
        if (!user) {
          showToast(
            "No authenticated user found. Please sign in again.",
            "error"
          );
          setSubmitting(false);
          return;
        }
        const postData = {
          title,
          content,
          slug,
          author_name: authorName,
          cover_image_url: coverImageUrl,
          author_id: user.id,
        };
        const { error } = await supabase.from("posts").insert(postData);
        if (error) {
          console.error("Error creating post:", error);
          showToast("Error creating post: " + error.message, "error");
        } else {
          showToast("Post created successfully!", "success");
        }
      }

      // Reset form and refresh posts list
      setTitle("");
      setContent("");
      setSlug("");
      setAuthorName("");
      setCoverImageUrl("");
      setEditingId(null);

      // Re-fetch posts to reflect changes
      await fetchPosts();
    } catch (error) {
      console.error("Unexpected error:", error);
      showToast("An unexpected error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== EDIT POST HANDLER =====
  const handleEdit = (post: Post) => {
    setTitle(post.title);
    setContent(post.content);
    setSlug(post.slug);
    setAuthorName(post.author_name || "");
    setCoverImageUrl(post.cover_image_url || "");
    setEditingId(post.id);
  };

  // ===== DELETE POST HANDLER =====
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .select();
      console.log("Delete response:", { data, error });
      if (error) {
        console.error("Error deleting post:", error);
        showToast("Error deleting post: " + error.message, "error");
      } else if (!data || data.length === 0) {
        showToast("No post was deleted. Are you authenticated?", "error");
      } else {
        showToast("Post deleted successfully!", "success");
        // Re-fetch posts to reflect changes
        await fetchPosts();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      showToast("An unexpected error occurred", "error");
    }
  };

  // ===== SIGN OUT HANDLER =====
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ===== DATE FORMATTING HELPER =====
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

  // ===== LOADING STATE =====
  if (loading) return <AdminSkeleton />;

  // ===== MAIN RENDER =====
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
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* HEADER SECTION */}
        {showHeader && (
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-gray-600">Manage your blog posts</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* FORM SECTION - Left side (3/5 width) */}
          <div className="xl:col-span-3">
            <div className="shadow-lg rounded-lg p-6 border bg-gray-50 border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                {editingId ? "Edit Post" : "Create New Post"}
              </h2>

              {/* POST CREATION/EDITING FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Input */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white border-gray-300 text-gray-900"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Slug Input */}
                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium  mb-2 text-gray-700"
                  >
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="post-url-slug"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white border-gray-300 text-gray-900"
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated from title, but you can customize it
                  </p>
                </div>

                {/* Author Name Input */}
                <div>
                  <label
                    htmlFor="authorName"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    Author Name
                  </label>
                  <input
                    id="authorName"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Enter author name"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white border-gray-300 text-gray-900"
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Cover Image Upload */}
                <ImageUpload
                  value={coverImageUrl}
                  onChange={setCoverImageUrl}
                  label="Cover Image"
                />

                {/* Rich Content Editor */}
                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium  mb-2 text-gray-700"
                  >
                    Content
                  </label>
                  <RichContentEditor value={content} onChange={setContent} />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {content.length} characters
                    </p>
                    <p className="text-xs text-gray-500">
                      {
                        content.split(/\s+/).filter((word) => word.length > 0)
                          .length
                      }{" "}
                      words
                    </p>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        {editingId ? "Update Post" : "Create Post"}
                      </>
                    )}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setTitle("");
                        setContent("");
                        setSlug("");
                        setAuthorName("");
                        setCoverImageUrl("");
                        setEditingId(null);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* POSTS LIST SECTION - Right side (2/5 width) */}
          <div className="xl:col-span-2">
            <div className="shadow-lg rounded-lg p-6 border bg-gray-50 border-gray-200">
              {/* Posts List Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Existing Posts ({posts.length})
                </h2>
                <div className="text-sm text-gray-500">
                  {posts.length === 0
                    ? "No posts yet"
                    : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {/* Empty State */}
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No posts
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first post.
                  </p>
                </div>
              ) : (
                /* Posts List */
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-lg border hover:shadow-md transition-shadow duration-200 bg-white border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          {/* Post Title */}
                          <h3 className="text-lg font-semibold mb-2 truncate text-gray-900">
                            {post.title}
                          </h3>

                          {/* Post Metadata */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
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
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {formatDate(post.created_at)}
                            </span>
                            {post.author_name && (
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
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                {post.author_name}
                              </span>
                            )}
                          </div>

                          {/* Post Content Preview */}
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {post.content.substring(0, 100)}...
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(post)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
