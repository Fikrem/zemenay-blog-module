# Zemenay Plug-and-Play Blog for Next.js

A modular blog system that plugs into any Next.js app in minutes. Uses Supabase (PostgreSQL) for storage, provides an admin UI, and a frontend UI. Install, configure env, run migrations, and you are production-ready.

## Features
- Plug-and-play components: `BlogModule` (frontend) and `BlogAdmin` (admin)
- Supabase Auth-protected admin dashboard
- PostgreSQL via Supabase with simple schema
- Markdown with images and YouTube embeds
- Cover image upload via Supabase Storage
- Dark/Light theme toggle
- Next.js App Router compatible

## Quick Start

1) Install dependencies

```bash
npm i
```

2) Configure environment

Create `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3) Create database schema in Supabase

Run this SQL in Supabase SQL editor:

```sql
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  author_name text,
  author_id uuid,
  cover_image_url text,
  created_at timestamp with time zone default now()
);

-- row level security
alter table posts enable row level security;

-- allow read for all
create policy "Public read posts" on posts
for select using (true);

-- allow insert/update/delete for authenticated users
create policy "Authenticated write posts" on posts
for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
```

4) Create Supabase Storage bucket (optional for images)
- Create bucket `blog-images` as public

5) Run the app

```bash
npm run dev
```

Open `/blog` to see posts and `/auth/signin` to sign in, then `/admin` to manage posts.

## Using as a module in your Next.js app

- Copy `src/components/BlogModule.tsx` and `src/components/BlogAdmin.tsx` into your project or import from this package entry when published.
- Ensure your app has the middleware to protect admin:

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.redirect(new URL('/auth/signin', req.url));
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
```

- Add routes:
  - `/blog/[[...slug]]/page.tsx` renders `<BlogModule />`
  - `/admin/page.tsx` renders `<BlogAdmin />`
  - `/auth/signin/page.tsx` provides sign-in form

- Create `src/lib/supabase.ts` using env values (see this repo’s file) and import `supabase` from it.

## API/Components

- `BlogModule({ slug?: string[] })`: lists posts or renders a single post by slug. Uses Supabase `posts` table.
- `BlogAdmin()`: admin dashboard for CRUD on posts, image upload, and rich content editor; requires authenticated Supabase session.

## Integration with public website template
- This module is UI-agnostic; drop the components into any App Router project. Style is Tailwind-friendly and themeable.

## Scripts
- `dev`: local development
- `build`: Next.js build
- `start`: start production server

## Deployment
- Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as env vars on your host (Vercel, etc.)
- Ensure Supabase RLS policies and bucket are set as above

## License & Ownership
- Prepare your GitHub repo, then transfer ownership to Zemenay Tech Solutions per challenge requirement.

## Notes
- If you need a pure NPM module, expose `src/index.ts` and publish; consumers must bring their own Next.js + Supabase config and routes per above.
