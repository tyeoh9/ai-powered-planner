import { Editor } from '@/components/Editor/Editor'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Planning Editor</h1>
          <p className="text-gray-600">
            Start describing your project and get AI-powered suggestions
          </p>
        </header>

        <Editor />

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono text-xs">Tab</kbd> to
            accept suggestions,{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono text-xs">Esc</kbd> to reject
          </p>
        </footer>
      </div>
    </main>
  )
}
