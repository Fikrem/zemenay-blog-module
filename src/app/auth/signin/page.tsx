'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    const r = params.get('redirect');
    if (m === 'signup') setMode('signup');
    if (r) setRedirect(r);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // After sign-up, attempt sign-in
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(signInErr.message);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        window.location.href = redirect || '/admin';
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  };

  return (
    <html className="h-full bg-gray-800">
      <body className="h-full ">
        <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-800">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
              {mode === 'signup' ? 'Create an account' : 'Sign in to your account'}
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    autoComplete="email"
                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">
                    Password
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  {mode === 'signup' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm text-gray-300">
              {mode === 'signup' ? (
                <a href={`/auth/signin${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="hover:underline">
                  Already have an account? Sign in
                </a>
              ) : (
                <a href={`/auth/signin?mode=signup${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`} className="hover:underline">
                  Need an account? Sign up
                </a>
              )}
            </div>

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
        </div>
      </body>
    </html>
  );
}