# Talmudic Study App - AI-Powered Hebrew/Aramaic Translation

**Real-time streaming translation application** for Talmudic texts using Google Gemini 2.5 Flash with inline commentary integration and intelligent navigation.

## 🎯 Overview

A modern web application that makes classical Talmudic scholarship accessible through AI-powered real-time translation, transforming complex Hebrew/Aramaic texts into readable English with scholarly commentary (Mefarshim) integration.

## 📊 Production Features

- **Real-time AI streaming** translation with animated cursor feedback
- **Sectioned text display** with side-by-side Hebrew/English layout
- **Inline commentary (Mefarshim)** integration with nested exploration
- **Translation persistence** with visual highlighting for previously translated texts
- **User journey tracking** for study session analytics
- **Smart navigation** with breadcrumb trails and expandable text trees

## 🏗️ Technical Architecture

### AI Translation Pipeline

```
Sefaria API → Hebrew/Aramaic Text → Google Gemini 2.5 Flash → Streaming Translation → React UI
     ↓              ↓                         ↓                        ↓
Commentary     Section Parser        Real-time Chunks          Progressive Display
 Links         (numbered)            (200 chars/sec)           (green highlights)
```

### Core Tech Stack
- **Next.js 15** with App Router and React Server Components
- **TypeScript** for type-safe development
- **Supabase** - PostgreSQL backend with Row-Level Security (RLS)
- **Google Gemini 2.5 Flash** via OpenRouter for scholarly translation
- **Tailwind CSS 4** + shadcn/ui for modern component design
- **SWR** for optimistic UI and data fetching
- **Zustand** for client state management

### Performance Characteristics
- **Streaming speed**: ~200 characters/second translation rate
- **Translation persistence**: Previously translated sections load instantly
- **Smart caching**: LRU cache for Sefaria API responses
- **Rate limiting**: Upstash Redis integration prevents API abuse
- **User journey tracking**: PostgreSQL analytics for study patterns

## ✨ Key Features Deep Dive

### 1. Real-Time Streaming Translation
Watch scholarly translations appear word-by-word as Google Gemini processes Hebrew/Aramaic source texts:

```typescript
// Streaming translation endpoint
app/api/translate-stream/route.ts

// Features:
// - Server-Sent Events (SSE) for real-time streaming
// - 200 character chunks for smooth UI updates
// - Animated cursor shows translation in progress
// - Automatic persistence to Supabase on completion
```

### 2. Sectioned Text Display
Gemara text divided into numbered sections with intelligent formatting:

- **70% English / 30% Hebrew** split for English learners
- **Section numbering** for easy reference and navigation
- **Expandable commentary** buttons on hover
- **Green highlighting** indicates previously translated Mefarshim
- **Nested commentary** support for commentaries on commentaries

### 3. Commentary (Mefarshim) Integration
Inline access to classical commentaries with smart UI:

- **One commentary per section** rule for focused study
- **Sefaria API integration** for commentary text and links
- **Real-time translation** of commentary when expanded
- **Visual indicators** (green) for already-translated commentaries
- **Nested depth tracking** prevents infinite commentary loops

### 4. User Journey Analytics
PostgreSQL-backed tracking system:

```sql
-- Tracks study sessions, revisited texts, translation history
user_journeys table:
- user_id (Supabase auth)
- talmud_reference (e.g., "Berakhot 2a")
- visited_at timestamp
- translation_count
- mefarshim_explored (JSONB array)
```

## 🚀 Setup & Deployment

### Prerequisites
- Node.js ≥18.0.0
- Supabase project with PostgreSQL database
- OpenRouter account with API key
- Vercel account (recommended for deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/mordechaipotash/talmudic-study-app.git
cd talmudic-study-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_MODEL=google/gemini-2.5-flash

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run in Supabase SQL Editor:

```sql
-- Translations storage
CREATE TABLE translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  talmud_reference TEXT NOT NULL,
  section_number INTEGER NOT NULL,
  hebrew_text TEXT NOT NULL,
  english_translation TEXT NOT NULL,
  translation_model TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User journey tracking
CREATE TABLE user_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  talmud_reference TEXT NOT NULL,
  section_number INTEGER,
  mefaresh_name TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID
);

-- Enable RLS
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own translations"
  ON translations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translations"
  ON translations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

## 📱 Usage Flow

### Student Experience
1. **Search** for any Talmudic text (e.g., "Berakhot 2a")
2. **View** sectioned Hebrew/Aramaic text from Sefaria
3. **Translate** sections with real-time streaming AI
4. **Explore** inline commentaries (Rashi, Tosafot, etc.)
5. **Track** study history and revisit previous texts

### Technical Flow
1. Sefaria API fetch → Parse Hebrew text → Display sections
2. User clicks "Translate" → Streaming API call → Gemini 2.5 Flash
3. Stream chunks → React state updates → Animated display
4. Translation complete → Save to Supabase → Green highlight
5. User journey logged → Analytics updated

## 🔧 Development

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 💼 Use Cases

- **Yeshiva Students**: Study Talmud with instant English translation
- **Adult Learners**: Access classical texts without Hebrew mastery
- **Rabbis & Educators**: Prepare lessons with AI translation support
- **Researchers**: Analyze Talmudic passages with commentary cross-reference
- **Global Jewish Community**: Learn Talmud regardless of language background

## 🎓 Technical Highlights

- **Server-Sent Events (SSE)** for streaming translation without WebSockets
- **React Server Components** for optimal performance
- **Optimistic UI updates** with SWR for instant feedback
- **Translation caching** prevents redundant AI calls
- **Rate limiting** with Upstash Redis protects API quotas
- **RLS policies** ensure user data isolation
- **Responsive design** works on mobile/tablet/desktop

## 📂 Project Structure

```
talmudic-study-app/
├── app/
│   ├── api/
│   │   ├── translate/          # Standard translation endpoint
│   │   └── translate-stream/   # Streaming translation with SSE
│   ├── components/
│   │   ├── gemara-section.tsx        # Individual section with mefarshim
│   │   ├── reference-card.tsx        # Main text display
│   │   ├── expandable-mefaresh.tsx   # Commentary UI logic
│   │   └── ui/                       # shadcn/ui components
│   └── page.tsx                # Main study interface
├── lib/
│   ├── supabase/              # Supabase client configuration
│   └── utils.ts               # Helper functions
└── public/                    # Static assets
```

## 🌟 Innovation Showcase

**Why This Project Stands Out**:
- **Real-time AI streaming** for scholarly translation (not simple chatbot)
- **Domain expertise**: Understanding of Hebrew/Aramaic + Talmudic scholarship
- **Complex UX**: Nested commentaries, bilingual layout, smart highlighting
- **Production-ready**: User auth, journey tracking, rate limiting, RLS
- **Modern stack**: Next.js 15, React 19, TypeScript 5, Tailwind 4

**Recruiter Signals**:
- AI/ML integration for domain-specific applications
- Complex state management across nested components
- Real-time data streaming and progressive UI updates
- Full-stack development with authentication and analytics
- Cultural/domain expertise (Jewish scholarship technology)

---

**Built by Mordechai Potash** | [Portfolio](https://github.com/mordechaipotash) | 120 hours invested