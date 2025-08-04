'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      console.error('Sign-in error:', error);
    } else {
      console.log('Sign-in success - waiting for session sync...');
      // onAuthStateChange fires when the cookie is set on the client
   const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
  if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
    console.log('Redirecting to /admin because session is present.');
    window.location.href = '/admin';
  }
});

      // Clean up listener if user leaves the page
      return () => {
        listener.subscription.unsubscribe();
      };
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Sign In</h1>
      <form onSubmit={handleSignIn} className="max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 mb-2 w-full"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 mb-2 w-full"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Sign In
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}
