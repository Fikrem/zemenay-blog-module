# Zemenay Blog kit

A modular, plug-and-play blog system built for Next.js applications. This solution provides a complete blog system with admin panel, user authentication, and interactive features that can be easily integrated into any Next.js frontend.


## ✨ Features

### Core Blog Features

- **📝 Blog Post Management**: Create, edit, and delete blog posts with rich content editor
- **🖼️ Media Support**: Upload and embed images and videos in blog posts
- **🔗 SEO-Friendly URLs**: Automatic slug generation with customization options
- **📅 Content Scheduling**: Built-in date management for posts
- **👤 Author Attribution**: Support for author names and metadata

### Interactive Features

- **👍 Like/Dislike System**: Users can react to blog posts
- **💬 Comments System**: Full commenting functionality with user authentication
- **👥 User Authentication**: Separate authentication system for blog readers
- **📊 Reaction Statistics**: Real-time like, dislike, and comment counts

### Admin Features

- **🎛️ Admin Dashboard**: Complete admin panel for content management
- **📊 Post Analytics**: View post statistics and engagement metrics
- **🖼️ Media Management**: Upload and manage images through Supabase storage
- **⚡ Real-time Updates**: Live updates for post management

### Technical Features

- **🚀 Next.js 14**: Built with the latest Next.js App Router
- **🗄️ Supabase Integration**: PostgreSQL database with real-time capabilities
- **🎨 Tailwind CSS**: Modern, responsive design system
- **📱 Responsive Design**: Mobile-first approach
- **🔒 Row Level Security**: Secure database access with RLS policies
- **⚡ Performance Optimized**: Fast loading and efficient data handling

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Content Rendering**: MarkdownIt
- **Language**: TypeScript

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account


## Blog module CLI (scaffold only)

This package includes a small CLI to scaffold the pages and middleware into a Next.js App Router project. It does not touch your database. Follow the Supabase setup instructions elsewhere in this README.

Usage:

```bash
# Add to an existing Next.js app
npm i zemenay-blog-kit

# Scaffold pages and middleware
npx zemenay-blog-kit scaffold \
  --basePath=blog \
  --adminPath=admin \
  --authPath=auth/signin
```

Options:
- `--srcDir=src|.`: where your `app/` lives (auto-detected)
- `--basePath`: blog route base (default `blog`)
- `--adminPath`: admin route base (default `admin`)
- `--authPath`: sign-in page path (default `auth/signin`)
- `--force`: overwrite existing files

Generated files:
- `app/<basePath>/[[...slug]]/page.tsx` (public blog)
- `app/<adminPath>/page.tsx` (admin dashboard)
- `app/<authPath>/page.tsx` (sign-in)
- `middleware.ts` protecting `/<adminPath>`
### supabase setup

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author_name TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_reactions table
CREATE TABLE user_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_user_reactions_post_id ON user_reactions(post_id);
CREATE INDEX idx_user_reactions_user_id ON user_reactions(user_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
-- Allow authenticated users to create posts, attributing to themselves
CREATE POLICY "Users can insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
-- Allow authors to update their own posts
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
-- Allow authors to delete their own posts (optional)
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Reactions are viewable by everyone" ON user_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert reactions" ON user_reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own reactions" ON user_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON user_reactions FOR DELETE USING (auth.uid() = user_id);

-- Create functions and triggers for automatic count updates
-- (See full SQL script in database_setup.sql for complete implementation)
```

### 3. Storage Setup

Create a storage bucket named `blog-images` in your Supabase dashboard with public access.

Then apply the following storage policy to allow public read/write for this bucket (optional, for simplicity):

```sql
-- Allow anyone to do anything with objects in this bucket
create policy "Public full access"
on storage.objects
for all
using ( bucket_id = 'blog-images' )
with check ( bucket_id = 'blog-images' );
```
### 4. admin user creation

For the creation of the admin user follow the following steps 
Go to your Supabase project dashboard.

In the left-hand menu, click on "Authentication".

Under the "Authentication" section, select "Users".

Click the "Invite" button to manually add a new user.

Enter the user's email address and a temporary password.

The user will receive an email to confirm their account. Once they confirm, they will be an active user.


### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000/blog](http://localhost:3000/blog) to view the blog.

## 🚀 Usage

### Admin Access

- Navigate to `/admin` to access the admin dashboard
- Manage blog posts, upload media, and view analytics

### Blog Features

- **Homepage**: View all blog posts at `/blog`
- **Individual Posts**: Access posts at `/blog/[slug]`
- **User Authentication**: Sign up/sign in to like, dislike, and comment
- **Interactive Features**: React to posts and engage with content

### Integration

The blog module is designed to be easily integrated into existing Next.js applications:

1. Copy the components to your project
2. Set up Supabase configuration
3. Import and use the `BlogModule` component
4. Customize styling and functionality as needed

### Embedding in host apps with existing headers

If your host app already has its own top navigation/header, you can either hide this module's internal header or add a top offset so content isn't overlapped.

Examples:

```tsx
// Hide internal header, add 64px top padding
<BlogModule showHeader={true} topOffset={64} />
```
```tsx
// Admin page with 4rem offset (Tailwind-like spacing) and header visible
<BlogAdmin topOffset="4rem" showHeader />
```

Props:

- `showHeader?: boolean` (default: true) — toggles the internal header
- `topOffset?: number | string` (default: 0) — extra top padding to avoid host header overlap

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── blog/              # Blog pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── BlogAdmin.tsx      # Admin dashboard component
│   ├── BlogModule.tsx     # Main blog component
│   └── UserAuth.tsx       # User authentication
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client configuration
└── styles/                # Global styles
    └── globals.css        # Tailwind CSS imports
```

## 🔧 Configuration

### Customization Options

- **Styling**: Modify Tailwind classes in components
- **Database Schema**: Extend tables for additional features
- **Authentication**: Customize user roles and permissions
- **Content Types**: Add support for different content formats


### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Secure user authentication via Supabase
- **Input Validation**: Client and server-side validation
- **CORS Protection**: Configured for secure cross-origin requests
- **Environment Variables**: Secure configuration management

## 📊 Performance

- **Static Generation**: Optimized for fast loading
- **Image Optimization**: Automatic image optimization via Next.js
- **Database Indexing**: Optimized queries with proper indexing
- **Caching**: Built-in caching strategies
- **Code Splitting**: Automatic code splitting for better performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

---






