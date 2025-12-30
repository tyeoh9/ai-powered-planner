import { NavBar } from '@/components/NavBar'
import Link from 'next/link'

const GITHUB_URL = 'https://github.com/tyeoh9/ai-powered-planner'

const currentFeatures = [
  {
    title: 'AI Suggestions',
    description: 'Real-time writing assistance that thinks alongside you, offering contextual suggestions as you type.',
  },
  {
    title: 'Google Docs-style Pagination',
    description: 'Multi-page documents with automatic page breaks, just like a traditional word processor.',
  },
  {
    title: 'Auto-save',
    description: 'Never lose your work. Documents are automatically saved as you write.',
  },
  {
    title: 'Clean, Distraction-free UI',
    description: 'A minimal interface that lets you focus on what matters: your writing.',
  },
]

const comingSoon = [
  {
    title: 'Embeddable Components',
    description: 'Insert timelines, tables, and other rich components into your documents.',
  },
  {
    title: 'Bring Your Own API Key',
    description: 'Use your personal OpenAI or Anthropic API keys with secure storage.',
  },
  {
    title: 'Formatting Toolbar',
    description: 'Style text with headings, font sizes, colors, and bullet points.',
  },
  {
    title: 'Inline AI Commands',
    description: 'Highlight text and instruct AI to rewrite, expand, or transform it.',
  },
  {
    title: 'Suggestion Sensitivity',
    description: 'Control AI output length - from single sentences to full paragraphs.',
  },
  {
    title: 'Writing Mode Presets',
    description: 'Switch between Coding, Creative, and Planning modes with specialized AI agents.',
  },
]

export default function FeaturesPage() {
  return (
    <main className="contribute-page">
      <NavBar />

      <div className="contribute-section">
        <h1 className="contribute-title">Features</h1>
        <p className="contribute-subtitle">
          AI-powered writing, reimagined
        </p>

        {/* Current Features */}
        <section className="contribute-block">
          <h2>What you can do today</h2>
          <div className="feature-grid">
            {currentFeatures.map((feature) => (
              <div key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coming Soon */}
        <section className="contribute-block">
          <h2>Coming Soon</h2>
          <p className="block-intro">Help us build these features:</p>
          <div className="feature-grid">
            {comingSoon.map((feature) => (
              <div key={feature.title} className="feature-card coming-soon">
                <div className="feature-card-header">
                  <h3>{feature.title}</h3>
                  <span className="coming-soon-tag">Soon</span>
                </div>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contribute Section */}
        <section className="contribute-block">
          <h2>Contribute</h2>
          <p className="block-intro">Inky is open source. Here's how to get started:</p>
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

        {/* CTAs */}
        <div className="cta-row">
          <Link href="/login" className="contribute-cta">
            Start Writing
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="contribute-cta-secondary"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </main>
  )
}
