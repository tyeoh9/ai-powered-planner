import { NavBar } from '@/components/NavBar'

const GITHUB_URL = 'https://github.com/tyeoh9/ai-powered-planner'

const features = [
  {
    title: 'Embeddable Components',
    description: 'Insert timelines, tables, and other rich components into documents',
  },
  {
    title: 'Bring Your Own API Key',
    description: 'Use personal OpenAI/Anthropic keys with secure storage',
  },
  {
    title: 'Formatting Toolbar',
    description: 'Style text with headings, font size, colors, and bullet points',
  },
  {
    title: 'Inline AI Commands',
    description: 'Highlight text and open a popup to instruct AI on the selection',
  },
  {
    title: 'Suggestion Sensitivity',
    description: 'Control AI output length - from single sentences to full paragraphs',
  },
  {
    title: 'Writing Mode Presets',
    description: 'Switch between Coding, Creative, and Planning modes with specialized agents',
  },
]

export default function ContributePage() {
  return (
    <main className="contribute-page">
      <NavBar />

      <div className="contribute-section">
        <h1 className="contribute-title">Contribute to Inky</h1>
        <p className="contribute-subtitle">
          Help build the open-source AI writing companion
        </p>

        {/* Getting Started */}
        <section className="contribute-block">
          <h2>Getting Started</h2>
          <div className="code-steps">
            <div className="code-step">
              <span className="step-label">Clone the repo</span>
              <code>git clone {GITHUB_URL}.git</code>
            </div>
            <div className="code-step">
              <span className="step-label">Install dependencies</span>
              <code>pnpm install</code>
            </div>
            <div className="code-step">
              <span className="step-label">Set up environment</span>
              <code>cp .env.example .env.local</code>
            </div>
            <div className="code-step">
              <span className="step-label">Run dev server</span>
              <code>pnpm dev</code>
            </div>
          </div>
          <p className="contribute-note">
            See the{' '}
            <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noopener noreferrer">
              README
            </a>{' '}
            for environment variable details.
          </p>
        </section>

        {/* Feature Roadmap */}
        <section className="contribute-block">
          <h2>Feature Roadmap</h2>
          <p className="block-intro">Features we'd love help building:</p>
          <div className="feature-grid">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Contribute */}
        <section className="contribute-block">
          <h2>How to Contribute</h2>
          <ol className="contribute-steps">
            <li>
              <strong>Find an issue</strong> - Browse{' '}
              <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">
                GitHub Issues
              </a>{' '}
              or pick a roadmap feature
            </li>
            <li>
              <strong>Fork & branch</strong> - Create a feature branch from <code>main</code>
            </li>
            <li>
              <strong>Make changes</strong> - Keep PRs focused and well-tested
            </li>
            <li>
              <strong>Submit PR</strong> - Reference the issue and describe your changes
            </li>
          </ol>
        </section>

        {/* CTA */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="contribute-cta"
        >
          View on GitHub
        </a>
      </div>
    </main>
  )
}
