import { NavBar } from '@/components/NavBar'

const changelog = [
  {
    date: 'Dec 30, 2024',
    version: '0.1.0',
    title: 'Initial Release',
    changes: [
      'AI-powered writing suggestions',
      'Google Docs-style pagination',
      'Auto-save functionality',
      'Google authentication',
      'Dark theme UI',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="contribute-page">
      <NavBar />

      <div className="contribute-section">
        <h1 className="contribute-title">Changelog</h1>
        <p className="contribute-subtitle">
          What's new in Inky
        </p>

        <div className="changelog-list">
          {changelog.map((entry) => (
            <article key={entry.version} className="changelog-entry">
              <div className="changelog-header">
                <span className="changelog-date">{entry.date}</span>
                <span className="version-tag">v{entry.version}</span>
              </div>
              <h3 className="changelog-title">{entry.title}</h3>
              <ul className="changelog-changes">
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
