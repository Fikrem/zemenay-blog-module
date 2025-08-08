-- Posts table
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

-- Enable RLS
alter table posts enable row level security;

-- Public read policy
create policy if not exists "Public read posts" on posts
for select using (true);

-- Authenticated write policy
create policy if not exists "Authenticated write posts" on posts
for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);