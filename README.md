# AI-Powered Document

A smart text editor with AI-powered autocomplete that understands context and maintains document consistency.

![Editor Demo](docs/demo.gif)
*Demo placeholder - add a GIF showing the editor in action*

## Features

### Fill-in-the-Middle (FIM) Suggestions
The editor provides context-aware text completions that understand both what comes before *and after* your cursor:

- **Mid-sentence**: Completes partial thoughts naturally
- **End of sentence**: Suggests follow-up sentences
- **New paragraph**: Generates contextually relevant new content

Press `Tab` to accept suggestions, `Escape` to dismiss.

![FIM Example](docs/fim-example.png)
*Placeholder - screenshot showing inline suggestion*

### Consistency Checking
When you accept a suggestion that changes the document's direction, the editor automatically:

1. Chunks the document into paragraphs
2. Detects which sections may now be inconsistent
3. Suggests updates to maintain logical coherence

![Consistency Check](docs/consistency-check.png)
*Placeholder - screenshot showing dirty chunk indicator*

## How It Works

```
User types → Cursor context detected → Prefix/suffix extracted
                                              ↓
                                    Claude generates completion
                                              ↓
                          User accepts → Document chunked → LLM checks consistency
                                                                    ↓
                                                    Conflicting chunks queued for updates
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Editor**: TipTap / ProseMirror
- **AI**: Claude API (Anthropic)
- **State**: Zustand
- **Styling**: CSS

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/tyeoh9/ai-powered-planner.git
   cd ai-powered-planner
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ANTHROPIC_API_MODEL=claude-sonnet-4-20250514  # optional, defaults to claude-sonnet
   ```

4. Run the dev server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | `Tab` |
| Dismiss suggestion | `Escape` |
| Accept consistency patch | `Tab` |
| Skip patch | `Escape` |
| Dismiss all patches | `Shift+Escape` |

## License

MIT
