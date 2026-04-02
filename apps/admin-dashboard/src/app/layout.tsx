import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Admin — MonSiteVitrine',
  description: 'Dashboard administrateur MonSiteVitrine',
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: '\u25A1' },
  { href: '/prospects', label: 'Prospects', icon: '\u25C7' },
  { href: '/scraping', label: 'Scraping', icon: '\u21BB' },
  { href: '/sites', label: 'Sites', icon: '\u25C8' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
            <div className="p-6 border-b border-slate-700">
              <h1 className="text-lg font-bold">MonSiteVitrine</h1>
              <p className="text-slate-400 text-xs mt-1">Administration</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 px-3">v1.0.0</p>
            </div>
          </aside>
          <main className="flex-1 ml-64">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
