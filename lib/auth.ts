import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required')
}
if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
  throw new Error('AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET environment variables are required')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: async ({ auth }) => !!auth,
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
