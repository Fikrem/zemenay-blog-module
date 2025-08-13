#!/usr/bin/env node
import fs from "fs";
import path from "path";

interface Args {
  srcDir: string;
  basePath: string;
  adminPath: string;
  authPath: string;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    srcDir: "src",
    basePath: "blog",
    adminPath: "admin",
    authPath: path.join("auth", "signin"),
    force: false,
  };

  for (const raw of argv.slice(2)) {
    const [key, value] = raw.includes("=") ? raw.split("=") : [raw, "true"];
    switch (key) {
      case "--srcDir":
        if (value && value !== "true") args.srcDir = value.replace(/^\/+|\/+$/g, "");
        break;
      case "--basePath":
        if (value && value !== "true") args.basePath = value.replace(/^\/+|\/+$/g, "");
        break;
      case "--adminPath":
        if (value && value !== "true") args.adminPath = value.replace(/^\/+|\/+$/g, "");
        break;
      case "--authPath":
        if (value && value !== "true") args.authPath = value.replace(/^\/+|\/+$/g, "");
        break;
      case "--force":
        args.force = true;
        break;
      case "-f":
        args.force = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
      default:
        break;
    }
  }

  return detectSrcDir(args);
}

function detectSrcDir(args: Args): Args {
  const cwd = process.cwd();
  const hasSrcApp = fs.existsSync(path.join(cwd, "src", "app"));
  const hasRootApp = fs.existsSync(path.join(cwd, "app"));

  if (hasSrcApp) args.srcDir = "src";
  else if (hasRootApp) args.srcDir = ".";
  else args.srcDir = "src"; // will be created
  return args;
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(targetPath: string, content: string, force: boolean) {
  if (fs.existsSync(targetPath) && !force) {
    console.log(`Skipping existing file: ${targetPath} (use --force to overwrite)`);
    return;
  }
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content, "utf8");
  console.log(`Wrote ${targetPath}`);
}

function printHelp() {
  console.log(`zemenay-blog-kit CLI\n\nUsage:\n  npx zemenay-blog-kit scaffold [--srcDir=src|.] [--basePath=blog] [--adminPath=admin] [--authPath=auth/signin] [--force]\n\nActions:\n  scaffold   Create blog, admin, auth/signin pages and admin middleware.\n\nExamples:\n  npx zemenay-blog-kit  scaffold\n  npx zemenay-blog-kit scaffold --basePath=blog --adminPath=blog-admin\n`);
}

function scaffold(args: Args) {
  const cwd = process.cwd();
  const appRoot = path.join(cwd, args.srcDir === "." ? "" : args.srcDir, "app");
  ensureDir(appRoot);

  const pkgName = "zemenay-blog-kit";

  // blog page
  const blogPagePath = path.join(appRoot, args.basePath, "[[...slug]]", "page.tsx");
  const blogPageContent = `import { BlogModule } from '${pkgName}';

export default function BlogPage({ params }: { params: { slug?: string[] } }) {
  return <BlogModule slug={params.slug} />;
}
`;
  writeFile(blogPagePath, blogPageContent, args.force);

  // admin page
  const adminPagePath = path.join(appRoot, args.adminPath, "page.tsx");
  const adminPageContent = `import { BlogAdmin } from '${pkgName}';

export default function AdminPage() {
  return <BlogAdmin />;
}
`;
  writeFile(adminPagePath, adminPageContent, args.force);

  // auth signin page
  const authPagePath = path.join(appRoot, args.authPath, "page.tsx");
  const signinPageContent = `'use client';
import { useState } from 'react';
import { supabase } from '${pkgName}';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      console.error('Sign-in error:', error);
    } else {
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          window.location.href = '/${args.adminPath.replace(/'/g, "\\'")}';
        }
      });
      return () => listener.subscription.unsubscribe();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 px-6 py-12">
      <div className="w-full max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-white">Sign in to your account</h2>
        <form onSubmit={handleSignIn} className="mt-10 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-100">Email address</label>
            <div className="mt-2">
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required autoComplete="email" className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-100">Password</label>
            <div className="mt-2">
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password" className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm" />
            </div>
          </div>
          <button type="submit" className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Sign in</button>
        </form>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
`;
  writeFile(authPagePath, signinPageContent, args.force);

  // middleware (admin guard)
  const middlewarePath = path.join(cwd, args.srcDir === "." ? "" : args.srcDir, "middleware.ts");
  const middlewareContent = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const redirectUrl = new URL('/${args.authPath.replace(/'/g, "\\'")}', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  return res;
}

export const config = { matcher: ['/${args.adminPath.replace(/'/g, "\\'")}', '/${args.adminPath.replace(/'/g, "\\'")}/:path*'] };
`;
  writeFile(middlewarePath, middlewareContent, args.force);

  console.log("\nScaffold complete. Next steps:\n- Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local\n- Install peer deps if missing: next, react, react-dom, @supabase/supabase-js, @supabase/auth-helpers-nextjs\n- Add your Supabase schema and RLS (see README)\n");
}

function main() {
  const [cmd] = process.argv.slice(2);
  if (!cmd || cmd.startsWith("-")) {
    printHelp();
    process.exit(0);
  }

  const args = parseArgs(process.argv);
  switch (cmd) {
    case "scaffold":
      scaffold(args);
      break;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main();