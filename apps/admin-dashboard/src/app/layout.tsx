import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dashboard - Auto Site Factory',
  description: 'Internal admin dashboard for Auto Site Factory',
};

const navItems = [
  { href: '/', label: 'Dashboard', icon: '□' },
  { href: '/prospects', label: 'Prospects', icon: '◇' },
  { href: '/scraping', label: 'Scraping Jobs', icon: '↻' },
  { href: '/sites', label: 'Sites', icon: '◈' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-slate-50 min-h-screen`}>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
              <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold tracking-tight">
                  Auto Site Factory
                </h1>
                <p className="text-slate-400 text-sm mt-1">Admin Dashboard</p>
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
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-sm text-slate-300">Account</span>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-64">
              <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div />
                <div className="flex items-center gap-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </header>
              <div className="p-8">{children}</div>
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
