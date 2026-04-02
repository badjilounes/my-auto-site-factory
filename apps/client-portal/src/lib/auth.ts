import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';

const nextAuth = NextAuth({
  providers: [
    // Magic link via email (primary for clients)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.resend.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
        auth: {
          user: process.env.EMAIL_SERVER_USER || 'resend',
          pass: process.env.RESEND_API_KEY || '',
        },
      },
      from: process.env.EMAIL_FROM || 'MonSiteVitrine <noreply@monsitevitrine.fr>',
    }),
    // Credentials fallback (for auto-created accounts via outreach)
    CredentialsProvider({
      name: 'token',
      credentials: {
        email: { label: 'Email', type: 'email' },
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        // Verify token against backend API
        if (!credentials?.email) return null;
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
          const res = await fetch(`${API_URL}/clients/me`, {
            headers: { 'Authorization': `Bearer ${credentials.token}` },
          });
          if (!res.ok) return null;
          const client = await res.json();
          return {
            id: client.id,
            email: client.email as string,
            name: client.businessName as string,
            role: 'CLIENT',
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = 'CLIENT';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.id;
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const handlers: { GET: any; POST: any } = nextAuth.handlers;
export const signIn: any = nextAuth.signIn;
export const signOut: any = nextAuth.signOut;
export const auth: any = nextAuth.auth;
