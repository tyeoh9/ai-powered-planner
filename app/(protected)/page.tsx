import { getDocuments } from '@/lib/actions/documents'
import { getFolders } from '@/lib/actions/folders'
import { DocumentList } from '@/components/Documents/DocumentList'
import { SignOutButton } from '@/components/SignOutButton'

export default async function Home() {
  const [documents, folders] = await Promise.all([getDocuments(), getFolders()])

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <SignOutButton />
      <div className="max-w-6xl mx-auto px-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
            AI-powered Document
          </h1>
          <p className="text-gray-500">
            Describe your project and get AI-powered suggestions
          </p>
        </header>

        <DocumentList initialDocuments={documents} initialFolders={folders} />
      </div>
    </main>
  )
}
