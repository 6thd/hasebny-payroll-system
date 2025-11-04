import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@next-auth/firebase-adapter';
import { admin, adminDb } from '@/lib/firebase/admin'; // Corrected import to use adminDb

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: FirestoreAdapter(adminDb), // Use the imported adminDb instance
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        try {
            // Use the main admin object to access firestore for the callback
            const userDoc = await admin.firestore().collection('users').doc(token.sub).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              // The type extension we added previously will prevent TypeScript errors here
              session.user.role = userData?.role || 'employee';
            }
        } catch(e) {
            console.error("Error fetching user from firestore: ", e)
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
