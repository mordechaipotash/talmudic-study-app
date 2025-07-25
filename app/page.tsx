'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReferenceCard } from '@/components/reference-card'
import { TranslationSkeleton } from '@/components/translation-skeleton'
import { SearchBar } from '@/components/search-bar'
import { useSupabase } from '@/components/providers'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('recent')
  const [recentTexts, setRecentTexts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { supabase } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      loadRecentTexts()
    } else {
      setLoading(false)
    }
  }

  const loadRecentTexts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_journeys')
        .select(`
          id,
          sefaria_ref,
          visited_at,
          translations(
            hebrew_text,
            english_translation,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('visited_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Database error:', error)
        return
      }
      
      setRecentTexts(data || [])
    } catch (error) {
      console.error('Error loading recent texts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = (ref: string) => {
    router.push(`/text/${encodeURIComponent(ref)}`)
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Talmudic Study App</h1>
      
      <SearchBar />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          {loading ? (
            <>
              <TranslationSkeleton showMetrics />
              <TranslationSkeleton showMetrics />
              <TranslationSkeleton showMetrics />
            </>
          ) : recentTexts.length > 0 ? (
            recentTexts.map((journey) => (
              <ReferenceCard
                key={journey.id}
                sefariaRef={journey.sefaria_ref}
                hebrewText={journey.translations?.hebrew_text || ''}
                englishTranslation={journey.translations?.english_translation}
                metrics={{
                  translatedAt: journey.translations?.created_at,
                  lastViewed: journey.visited_at,
                  viewCount: journey.metrics?.views || 1,
                }}
                onNavigate={handleNavigate}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No recent texts. Start by searching for a text above.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sessions">
          <div className="text-center py-12 text-muted-foreground">
            <p>Study sessions coming soon...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="bookmarks">
          <div className="text-center py-12 text-muted-foreground">
            <p>Bookmarks coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
