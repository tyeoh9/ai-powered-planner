# AI-Powered Document

A smart text editor with AI-powered autocomplete that understands context and maintains document consistency.



## Features

<div align="center">
   <video autoplay loop muted controls>
   <source src="public/demo.mp4" type="video/mp4">
   Your browser does not support the video tag.
   </video>
</div>

### Fill-in-the-Middle (FIM) Suggestions
Context-aware text completions that understand both what comes before *and after* your cursor:

- **Mid-sentence**: Completes partial thoughts naturally
- **End of sentence**: Suggests follow-up sentences
- **New paragraph**: Generates contextually relevant new content

Press `Tab` to accept, `Escape` to dismiss.

### Consistency Checking
When you accept a suggestion that changes the document's direction, the editor automatically:

1. Chunks document into paragraphs
2. Detects inconsistent sections using embeddings
3. Suggests updates to maintain coherence

### Document Management
- Google authentication
- Create/organize documents in folders
- Auto-save with visual indicator

## How It Works

```
User types
↓
Context extracted
↓
Claude generates completion
↓
User accepts
↓
Document chunked
↓
Embeddings detect conflicts
↓
Conflicting chunks queued
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Editor**: TipTap / ProseMirror
- **AI**: Claude API via Vercel AI SDK
- **Embeddings**: Transformers.js (local)
- **Auth**: NextAuth (Google)
- **Database**: Supabase
- **State**: Zustand
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key
- Google OAuth credentials
- Supabase project

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

3. Configure `.env.local`:
   ```
   # Anthropic
   ANTHROPIC_API_KEY=your-api-key

   # Auth
   AUTH_SECRET=your-auth-secret
   AUTH_GOOGLE_ID=your-google-client-id
   AUTH_GOOGLE_SECRET=your-google-client-secret

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Run dev server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | `Tab` |
| Dismiss suggestion | `Escape` |
| Dismiss all patches | `Shift+Escape` |

## License

MIT
