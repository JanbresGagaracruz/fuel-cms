import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth'
import LoginForm from './LoginForm'

function landingPage(level: number): string {
  if (level >= 3) return '/dashboard' // Admin / Super Admin
  return '/contracts' // Staff / Viewer
}

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(landingPage((session.user?.accessLevel as number) ?? 1))
  }
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
