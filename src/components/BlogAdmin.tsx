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
    router.refresh();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Admin</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Post' : 'Create New Post'}</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border p-2 mb-2 w-full"
          required
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (unique)"
          className="border p-2 mb-2 w-full"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          className="border p-2 mb-2 w-full h-32"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-semibold mb-2">Existing Posts</h2>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="p-4 bg-gray-100 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{post.title}</p>
              <p className="text-sm text-gray-600">Slug: {post.slug}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(post)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
