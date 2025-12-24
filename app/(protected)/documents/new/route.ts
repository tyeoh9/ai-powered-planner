import { redirect } from 'next/navigation'
import { createDocument } from '@/lib/actions/documents'

export async function GET() {
  const { id } = await createDocument()
  redirect(`/documents/${id}`)
}
