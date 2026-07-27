import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? '';
      return email.endsWith('@coderabbit.ai');
    },
    async session({ session }) {
      if (session.user?.email) {
        (session.user as { email?: string; role?: string }).role =
          session.user.email === 'daniel@coderabbit.ai' ? 'vp' : 'csm';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
