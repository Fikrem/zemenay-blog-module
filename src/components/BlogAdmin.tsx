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
  const [submitting, setSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking...');
  const router = useRouter();

  // Test database connection
  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('posts').select('count(*)', { count: 'exact' });
      
      if (error) {
        console.error('Connection test error:', error);
        setConnectionStatus(`❌ Database Error: ${error.message}`);
        return false;
      } else {
        console.log('Connection test successful:', data);
        setConnectionStatus('✅ Database Connected');
        return true;
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setConnectionStatus(`❌ Connection Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };

  // Extract fetchPosts function so it can be reused
  const fetchPosts = async () => {
    setLoading(true);
    try {
      console.log('Fetching posts...');
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Fetch posts result:', { data, error });
      
      if (error) {
        console.error('Error fetching posts:', error);
        alert(`Error fetching posts: ${error.message}`);
      } else {
        console.log('Posts fetched successfully:', data);
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching posts:', err);
      alert('Unexpected error occurred while fetching posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const isConnected = await testConnection();
      if (isConnected) {
        await fetchPosts();
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !slug) return;

    setSubmitting(true);
    const postData = { title, content, slug };
    
    try {
      console.log('Submitting post data:', postData);
      
      if (editingId) {
        console.log('Updating post with ID:', editingId);
        const { data, error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', editingId)
          .select(); // Add select to get the updated data
        
        console.log('Update result:', { data, error });
        
        if (error) {
          console.error('Error updating post:', error);
          alert('Error updating post: ' + error.message);
        } else {
          console.log('Post updated successfully:', data);
          alert('Post updated successfully!');
        }
      } else {
        console.log('Creating new post');
        const { data, error } = await supabase
          .from('posts')
          .insert(postData)
          .select(); // Add select to get the inserted data
        
        console.log('Insert result:', { data, error });
        
        if (error) {
          console.error('Error creating post:', error);
          alert('Error creating post: ' + error.message);
        } else {
          console.log('Post created successfully:', data);
          alert('Post created successfully!');
        }
      }

      // Reset form and refresh posts list
      setTitle('');
      setContent('');
      setSlug('');
      setEditingId(null);
      
      // Re-fetch posts to reflect changes
      await fetchPosts();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (post: Post) => {
    setTitle(post.title);
    setContent(post.content);
    setSlug(post.slug);
    setEditingId(post.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      console.log('Deleting post with ID:', id);
      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .select(); // Add select to get the deleted data
      
      console.log('Delete result:', { data, error });
      
      if (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post: ' + error.message);
      } else {
        console.log('Post deleted successfully:', data);
        alert('Post deleted successfully!');
        // Re-fetch posts to reflect changes
        await fetchPosts();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Connection Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <p className="text-sm font-medium">Database Status: {connectionStatus}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Post' : 'Create New Post'}</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="border p-2 mb-2 w-full"
          required
          disabled={submitting}
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (unique)"
          className="border p-2 mb-2 w-full"
          required
          disabled={submitting}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          className="border p-2 mb-2 w-full h-32"
          required
          disabled={submitting}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')} Post
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
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-semibold mb-2">Existing Posts ({posts.length})</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500 italic">No posts yet. Create your first post above!</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="p-4 bg-gray-100 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{post.title}</p>
                <p className="text-sm text-gray-600">Slug: {post.slug}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(post.created_at).toLocaleDateString()}
                </p>
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
      )}
    </div>
  );
}
