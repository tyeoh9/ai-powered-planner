export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/(?:.*)(?<!login|api/auth|_next/static|_next/image|favicon.ico|demo.mp4|octopus.svg|.*\\.(svg|png|jpg|jpeg|gif|ico|mp4|webp))',
  ],
}