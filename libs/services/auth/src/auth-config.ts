import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        // In production, verify against database
        // For now, this is a placeholder
        if (!credentials?.email) return null;
        return {
          id: '1',
          email: credentials.email,
          name: 'Admin',
        };
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'client';
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
