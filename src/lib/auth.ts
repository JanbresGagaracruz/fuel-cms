import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.lst_User.findFirst({
          where: {
            UsrNam: credentials.username,
            enable: true,
          },
        })

        if (!user) return null

        const passwordField = user.password || user.Psswrd || ''
        const isValid = await bcrypt.compare(credentials.password, passwordField)
        if (!isValid) return null

        // Log activity
        await prisma.activityTrail.create({
          data: {
            userId: user.UserID,
            action: 'LOGIN',
            module: 'AUTH',
            details: `User ${user.UsrNam} logged in via credentials`,
          },
        }).catch(() => {})

        return {
          id: String(user.UserID),
          name: user.DisplayName || `${user.Firstname} ${user.Lastname}`,
          email: user.Email || '',
          image: null,
          accessLevel: user.access_level || 1,
          position: user.PositionName || '',
          plantId: user.PlantID || null,
          username: user.UsrNam,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessLevel = (user as any).accessLevel
        token.position = (user as any).position
        token.plantId = (user as any).plantId
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.accessLevel = token.accessLevel as number
        session.user.position = token.position as string
        session.user.plantId = token.plantId as number | null
        session.user.username = token.username as string
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
}
