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

-- Reactions table
create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  reaction text not null check (reaction in ('like','dislike')),
  created_at timestamp with time zone default now(),
  unique (post_id, user_id)
);

alter table post_reactions enable row level security;

create policy if not exists "Public read reactions" on post_reactions
for select using (true);

create policy if not exists "Users manage own reactions" on post_reactions
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null,
  author_email text,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table comments enable row level security;

create policy if not exists "Public read comments" on comments
for select using (true);

create policy if not exists "Users create comments" on comments
for insert to authenticated with check (auth.uid() = author_id);

create policy if not exists "Users update/delete own comments" on comments
for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);