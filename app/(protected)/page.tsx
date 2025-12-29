import { getDocuments } from '@/lib/actions/documents'
import { DocumentList } from '@/components/Documents/DocumentList'
import { SignOutButton } from '@/components/SignOutButton'
import { AppAvatar } from '@/components/AppAvatar'

export default async function Home() {
  const documents = await getDocuments()

  return (
    <main className="min-h-screen bg-gray-100 py-16">
      <AppAvatar />
      <SignOutButton />
      <div className="max-w-5xl mx-auto px-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-3">
            AI-powered Document
          </h1>
          <p className="text-lg text-gray-500">
            Describe your project and get AI-powered suggestions
          </p>
        </header>

        <DocumentList initialDocuments={documents} />
      </div>
    </main>
  )
}
