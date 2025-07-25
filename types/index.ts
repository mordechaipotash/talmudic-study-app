// Database types
export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  font_size: 'small' | 'medium' | 'large'
  translation_model: string
  auto_translate: boolean
  created_at: string
  updated_at: string
}

export interface Translation {
  id: string
  sefaria_ref: string
  hebrew_text: string
  english_translation: string
  model_used: string
  request_cost?: number
  cached_from?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserMetrics {
  id: string
  user_id: string
  sefaria_ref: string
  total_visits: number
  total_time_seconds: number
  notes?: string
  last_visited: string
  created_at: string
  updated_at: string
}

export interface UserJourney {
  id: string
  user_id: string
  session_id?: string
  sefaria_ref: string
  parent_ref?: string
  nav_state?: NavigationState
  metrics?: JourneyMetrics
  visited_at: string
}

export interface UserSession {
  id: string
  user_id: string
  name: string
  state: SessionState
  created_at: string
  updated_at: string
}

// Navigation types
export interface NavigationState {
  parent_ref?: string
  depth: number
  path: string[]
  expanded_nodes?: string[]
}

export interface JourneyMetrics {
  time_spent?: number
  translated?: boolean
  clicked_links?: string[]
  views?: number
}

export interface SessionState {
  rootRef: string
  tabs: TabState[]
  bookmarks: string[]
  lastActive?: string
}

export interface TabState {
  ref: string
  active: boolean
  scroll: number
  history?: string[]
}

// UI types
export interface ReferenceCardProps {
  hebrewText: string
  englishTranslation?: string
  sefariaRef: string
  metrics?: {
    translatedAt?: Date | string
    lastViewed?: Date | string
    viewCount: number
  }
  onNavigate: (ref: string) => void
  isExpanded?: boolean
  depth?: number
}

// API Response types
export interface TranslationResult {
  translation: string
  cached: boolean
  model: string
  cost?: number
}

export interface ApiError {
  error: string
  code?: string
  details?: any
}