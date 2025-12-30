export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/((?!login|features|changelog|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
