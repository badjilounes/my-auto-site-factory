import { Inter } from 'next/font/google';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { AuthNav } from './auth-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MonSiteVitrine - Portail Client',
  description:
    'Gerez votre site vitrine, votre abonnement et votre nom de domaine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${inter.className} bg-slate-50 text-zinc-900 min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MV</span>
                  </div>
                  <span className="text-lg font-bold text-zinc-900">
                    MonSiteVitrine
                  </span>
                </Link>
              </div>
              <AuthNav />
            </div>
          </header>

          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
            {children}
          </main>

          <footer className="border-t border-zinc-200 bg-white mt-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">
                &copy; {new Date().getFullYear()} MonSiteVitrine. Tous droits
                reserves.
              </p>
              <p className="text-sm text-zinc-400">
                Votre site vitrine professionnel.
              </p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
