# Talmudic Study App 📚

A modern, AI-powered web application for studying Talmudic texts with real-time streaming translation, inline commentary integration, and intelligent navigation.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Streaming Translation** - Watch translations appear as they're generated using Google Gemini 2.5 Flash
- **Sectioned Text Display** - Gemara divided into numbered sections with side-by-side Hebrew/English layout
- **Inline Commentary (Mefarshim)** - Access commentaries directly within each section
- **Nested Commentary Support** - Explore commentaries on commentaries
- **Translation Persistence** - Save and highlight previously translated texts
- **Smart Navigation** - Breadcrumb navigation with expandable text trees

### 🔥 Advanced Features
- **One-Commentary-at-a-Time** - Focus on single commentary per section for better comprehension
- **Green Highlighting** - Visual indicators for previously translated mefarshim
- **English-Centric Design** - 70% English, 30% Hebrew layout optimized for English learners
- **Streaming Interface** - Watch translations appear in real-time with animated cursor
- **Search Integration** - Find and navigate to any Talmudic text
- **User Journey Tracking** - Track study sessions and revisit recent texts

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - App Router with TypeScript
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Authentication, database, and real-time features
- **PostgreSQL** - Relational database for translations and user data
- **Row Level Security (RLS)** - Secure user data isolation

### AI & APIs
- **OpenRouter** - AI translation service
- **Google Gemini 2.5 Flash** - Primary translation model
- **Sefaria API** - Hebrew/Aramaic texts and commentary links
- **Streaming Translation** - Real-time text generation

### Deployment
- **Vercel** - Serverless deployment and hosting
- **Environment Variables** - Secure API key management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase project
- OpenRouter API key
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd talmudic-study-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create `.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Database Setup**
Run the included SQL migrations in your Supabase project:
```sql
-- See database/migrations.sql for complete schema
```

5. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

## 📖 Usage Guide

### Basic Study Flow
1. **Search for Text** - Use the search bar to find any Talmudic reference
2. **Read & Translate** - Click "Translate" on any section to get AI translation
3. **Explore Commentary** - Hover over Hebrew sections to see mefarshim buttons
4. **Deep Dive** - Click commentary names to see translations inline
5. **Navigate** - Use breadcrumbs or section links to explore related texts

### Key Features
- **Streaming Translation** - Watch text appear in real-time
- **Green Highlights** - Previously translated mefarshim are highlighted green
- **Section Focus** - Only one commentary per section for focused study
- **Persistent Learning** - All translations are saved for future reference

## 🏗️ Architecture

### Component Structure
```
components/
├── gemara-section.tsx      # Individual Gemara section with mefarshim
├── reference-card.tsx      # Main text display container
├── expandable-mefaresh.tsx # Commentary expansion logic
├── search-bar.tsx          # Text search interface
└── ui/                     # shadcn/ui components
```

### API Routes
```
app/api/
├── translate/              # Standard translation endpoint
└── translate-stream/       # Streaming translation endpoint
```

### Database Schema
- `translations` - Stores Hebrew texts and English translations
- `user_journeys` - Tracks user navigation and study sessions
- `user_metrics` - Analytics for study patterns

## 🔧 Configuration

### Translation Settings
- **Model**: Google Gemini 2.5 Flash (configurable)
- **Max Tokens**: 8000 tokens per translation
- **Temperature**: 0.3 for consistent scholarly translations
- **Streaming**: Real-time translation delivery

### UI Customization
- **Layout**: 70% English / 30% Hebrew split
- **Typography**: Optimized for Hebrew/English bilingual reading
- **Colors**: Blue theme with green translation indicators

## 🚀 Deployment

### Vercel Deployment
1. **Connect Repository** to Vercel
2. **Set Environment Variables** in Vercel dashboard
3. **Deploy** - Automatic deployment on push to main

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind for styling
- Maintain component modularity
- Add proper error handling
- Document complex logic

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sefaria** - For providing comprehensive Jewish text APIs
- **OpenRouter** - For AI translation infrastructure
- **Supabase** - For backend and database services
- **Vercel** - For seamless deployment
- **shadcn** - For beautiful UI components

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

---

**Built with ❤️ for the global Jewish learning community**
