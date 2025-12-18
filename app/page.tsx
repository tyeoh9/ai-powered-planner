import { Editor } from '@/components/Editor/Editor'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-16">
      <div className="max-w-5xl mx-auto px-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-3">
            AI-powered Document
          </h1>
          <p className="text-lg text-gray-500">
            Describe your project and get AI-powered suggestions
          </p>
        </header>

        <Editor />

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
