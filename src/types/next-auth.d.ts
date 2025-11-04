import 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user object to include custom properties.
   */
  interface User {
    id?: string;
    role?: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT token to include custom properties.
   */
  interface JWT {
    id?: string;
    role?: string;
  }
}
