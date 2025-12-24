import { notFound } from 'next/navigation'
import { getDocument } from '@/lib/actions/documents'
import { Editor } from '@/components/Editor/Editor'

interface DocumentPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params
  const document = await getDocument(id)

  if (!document) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-100 py-16">
      <div className="max-w-5xl mx-auto px-8">
        <Editor
          documentId={document.id}
          initialTitle={document.title}
          initialContent={document.content}
        />

        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>
            Press{' '}
            <kbd className="px-2.5 py-1 bg-white border border-gray-200 rounded-full font-mono text-xs shadow-sm">
              Tab
            </kbd>{' '}
            to accept,{' '}
            <kbd className="px-2.5 py-1 bg-white border border-gray-200 rounded-full font-mono text-xs shadow-sm">
              Esc
            </kbd>{' '}
            to reject
          </p>
        </footer>
      </div>
    </main>
  )
}
