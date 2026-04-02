'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-20 h-8 bg-zinc-100 rounded animate-pulse" />;
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <nav className="hidden md:flex items-center gap-1">
        <Link
          href="/site"
          className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          Mon Site
        </Link>
        <Link
          href="/billing"
          className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          Facturation
        </Link>
        <Link
          href="/domain"
          className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          Domaine
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">
          {session.user?.name || session.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Deconnexion
        </button>
      </div>
    </div>
  );
}
