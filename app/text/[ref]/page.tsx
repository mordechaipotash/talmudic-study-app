'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReferenceCard } from '@/components/reference-card'
import { NavigationTree } from '@/components/navigation-tree'
import { TranslationSkeleton } from '@/components/translation-skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import { useSefariaText } from '@/hooks/use-sefaria'
import { useSupabase } from '@/components/providers'
import { useNavigationStore } from '@/store/navigation'

export default function TextPage() {
  const params = useParams()
  const router = useRouter()
  const ref = decodeURIComponent(params.ref as string)
  
  const { hebrewText, loading: textLoading } = useSefariaText(ref)
  const { supabase } = useSupabase()
  
  const { 
    currentPath, 
    addToPath, 
    goBack, 
    goHome,
    expandedNodes,
    toggleNode 
  } = useNavigationStore()
  
  const [translation, setTranslation] = useState<string>()
  const [metrics, setMetrics] = useState<any>()

  useEffect(() => {
    if (ref) {
      addToPath(ref)
      loadTranslation()
      trackView()
    }
  }, [ref])

  const loadTranslation = async () => {
    try {
      const { data } = await supabase
        .from('translations')
        .select('*')
        .eq('sefaria_ref', ref)
        .single()
      
      if (data) {
        setTranslation(data.english_translation)
      }
    } catch (error) {
      console.error('Error loading translation:', error)
    }
  }

  const trackView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Track journey
      await supabase.from('user_journeys').insert({
        user_id: user.id,
        sefaria_ref: ref,
        nav_state: {
          parent_ref: currentPath[currentPath.length - 2],
          depth: currentPath.length,
          path: currentPath,
        },
      })

      // Update metrics
      await supabase.rpc('increment_view_count', {
        p_user_id: user.id,
        p_sefaria_ref: ref,
      })

      // Load metrics
      const { data: metricsData } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('sefaria_ref', ref)
        .single()
      
      setMetrics(metricsData)
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const handleNavigate = (newRef: string) => {
    router.push(`/text/${encodeURIComponent(newRef)}`)
  }

  const handleBack = () => {
    goBack()
    router.back()
  }

  const handleHome = () => {
    goHome()
    router.push('/')
  }

  return (
    <div className="container mx-auto py-4 px-4 max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHome}
        >
          <Home className="h-4 w-4" />
        </Button>
        
        {currentPath.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <h1 className="text-2xl font-semibold">{ref}</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        {/* Navigation Tree */}
        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <h2 className="text-sm font-medium mb-4">Navigation Path</h2>
            <NavigationTree
              currentPath={currentPath}
              expandedNodes={expandedNodes}
              onNodeClick={handleNavigate}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="space-y-6">
          {textLoading ? (
            <TranslationSkeleton lines={5} showMetrics />
          ) : (
            <ReferenceCard
              sefariaRef={ref}
              hebrewText={hebrewText}
              englishTranslation={translation}
              metrics={metrics ? {
                translatedAt: metrics.created_at,
                lastViewed: metrics.last_visited,
                viewCount: metrics.total_visits,
              } : undefined}
              onNavigate={handleNavigate}
              isExpanded
            />
          )}

        </main>
      </div>
    </div>
  )
}