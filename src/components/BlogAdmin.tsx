'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
}

export function BlogAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('posts').select('*');
      if (error) console.error('Error fetching posts:', error);
      else setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !slug) return;

    const postData = { title, content, slug };
    if (editingId) {
      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', editingId);
      if (error) console.error('Error updating post:', error);
    } else {
      const { error } = await supabase.from('posts').insert(postData);
      if (error) console.error('Error creating post:', error);
    }
    setTitle('');
    setContent('');
    setSlug('');
    setEditingId(null);
    router.refresh(); // Refresh the page to update the list
  };

  const handleEdit = (post: Post) => {
    setTitle(post.title);
    setContent(post.content);
    setSlug(post.slug);
    setEditingId(post.id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) console.error('Error deleting post:', error);
    else router.refresh();
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Blog Admin</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border p-2 mb-2 w-full"
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (unique)"
          className="border p-2 mb-2 w-full"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          className="border p-2 mb-2 w-full h-32"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded"
        >
          {editingId ? 'Update' : 'Create'} Post
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setContent('');
              setSlug('');
              setEditingId(null);
            }}
            className="bg-gray-500 text-white p-2 rounded ml-2"
          >
            Cancel
          </button>
        )}
      </form>
      <h2 className="text-2xl font-bold mb-2">Posts</h2>
      <ul className="list-disc pl-5">
        {posts.map((post) => (
          <li key={post.id} className="mb-2">
            <span>{post.title} (Slug: {post.slug})</span>
            <button
              onClick={() => handleEdit(post)}
              className="bg-yellow-500 text-white p-1 rounded ml-2"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(post.id)}
              className="bg-red-500 text-white p-1 rounded ml-2"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}