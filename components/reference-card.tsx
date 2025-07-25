'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ExternalLink, RotateCcw, Clock, Eye, Calendar, Languages, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslation } from '@/hooks/use-translation'
import { useSefariaSectionLinks } from '@/hooks/use-sefaria'
import { ExpandableMefaresh } from '@/components/expandable-mefaresh'
import { GemaraSection } from '@/components/gemara-section'
import { useSupabase } from '@/components/providers'
import { SefariaAPI, SefariaLink } from '@/lib/sefaria/api'
import { cn } from '@/lib/utils'

interface ReferenceCardProps {
  hebrewText: string | string[]
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

export function ReferenceCard({
  hebrewText,
  englishTranslation,
  sefariaRef,
  metrics,
  onNavigate,
  isExpanded = false,
  depth = 0,
}: ReferenceCardProps) {
  const { translate, translateStream, isTranslating } = useTranslation()
  const { supabase } = useSupabase()
  const [translation, setTranslation] = useState(englishTranslation)
  const [sectionTranslations, setSectionTranslations] = useState<Record<number, string>>({})
  const [translatingSection, setTranslatingSection] = useState<number | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)
  const [expandedMefarshim, setExpandedMefarshim] = useState<Record<number, SefariaLink | null>>({}) // One per section
  const [availableLinks, setAvailableLinks] = useState<SefariaLink[]>([])
  const [mefarshimTranslations, setMefarshimTranslations] = useState<Record<string, string>>({})
  const [streamingTranslation, setStreamingTranslation] = useState<Record<number, string>>({})
  const [streamingMefaresh, setStreamingMefaresh] = useState<Record<string, string>>({})
  const [streamingMefareshRef, setStreamingMefareshRef] = useState<string | null>(null)
  
  // Fetch section links for Hebrew arrays
  const { sectionLinks, fetchSectionLinks } = useSefariaSectionLinks(
    sefariaRef,
    Array.isArray(hebrewText) ? hebrewText : []
  )

  // Load existing section translations and available links on mount
  useEffect(() => {
    if (Array.isArray(hebrewText)) {
      loadSectionTranslations()
    }
    loadAvailableLinks()
    loadMefarshimTranslations()
  }, [sefariaRef, hebrewText])

  const loadAvailableLinks = async () => {
    try {
      const { commentary } = await SefariaAPI.getRelatedTexts(sefariaRef)
      setAvailableLinks(commentary)
      
      // Also load section-specific links for arrays
      if (Array.isArray(hebrewText)) {
        hebrewText.forEach((_, idx) => {
          fetchSectionLinks(idx)
        })
      }
    } catch (error) {
      console.error('Error loading available links:', error)
    }
  }

  const loadSectionTranslations = async () => {
    if (!Array.isArray(hebrewText)) return
    
    try {
      // Load translations for all sections at once
      const sectionRefs = hebrewText.map((_, idx) => `${sefariaRef}:${idx + 1}`)
      
      const { data } = await supabase
        .from('translations')
        .select('sefaria_ref, english_translation')
        .in('sefaria_ref', sectionRefs)
      
      if (data) {
        const translations: Record<number, string> = {}
        data.forEach((item) => {
          // Extract section index from ref (e.g., "Berakhot 2a:1" -> 0)
          const sectionMatch = item.sefaria_ref.match(/:(\d+)$/)
          if (sectionMatch) {
            const sectionIndex = parseInt(sectionMatch[1]) - 1
            translations[sectionIndex] = item.english_translation
          }
        })
        setSectionTranslations(translations)
      }
    } catch (error) {
      console.error('Error loading section translations:', error)
    }
  }

  const loadMefarshimTranslations = async () => {
    try {
      // Load all mefarshim translations for this base ref
      const { data } = await supabase
        .from('translations')
        .select('sefaria_ref, english_translation')
        .like('sefaria_ref', `%${sefariaRef}%`)
        .neq('sefaria_ref', sefariaRef) // Exclude the main text
      
      if (data) {
        const translations: Record<string, string> = {}
        data.forEach((item) => {
          translations[item.sefaria_ref] = item.english_translation
        })
        setMefarshimTranslations(translations)
      }
    } catch (error) {
      console.error('Error loading mefarshim translations:', error)
    }
  }

  const handleTranslate = async () => {
    try {
      // If hebrewText is array, join it for translation
      const textToTranslate = Array.isArray(hebrewText) ? hebrewText.join(' ') : hebrewText
      const result = await translate(textToTranslate, sefariaRef)
      setTranslation(result)
    } catch (error) {
      console.error('Translation failed:', error)
    }
  }

  const handleTranslateSection = async (sectionIndex: number, sectionText: string) => {
    try {
      setTranslatingSection(sectionIndex)
      setStreamingTranslation(prev => ({ ...prev, [sectionIndex]: '' }))
      
      const result = await translateStream(
        sectionText, 
        `${sefariaRef}:${sectionIndex + 1}`,
        (chunk: string) => {
          setStreamingTranslation(prev => ({
            ...prev,
            [sectionIndex]: (prev[sectionIndex] || '') + chunk
          }))
        }
      )
      
      setSectionTranslations(prev => ({
        ...prev,
        [sectionIndex]: result
      }))
      
      // Clear streaming state
      setStreamingTranslation(prev => {
        const newState = { ...prev }
        delete newState[sectionIndex]
        return newState
      })
    } catch (error) {
      console.error('Section translation failed:', error)
      setStreamingTranslation(prev => {
        const newState = { ...prev }
        delete newState[sectionIndex]
        return newState
      })
    } finally {
      setTranslatingSection(null)
    }
  }

  const handleMefareshClick = async (mefaresh: SefariaLink, sectionIndex: number) => {
    // Check if this mefaresh is already expanded in this section
    const currentExpanded = expandedMefarshim[sectionIndex]
    const isAlreadyExpanded = currentExpanded?.ref === mefaresh.ref
    
    if (isAlreadyExpanded) {
      // Remove expanded mefaresh from this section
      setExpandedMefarshim(prev => ({
        ...prev,
        [sectionIndex]: null
      }))
    } else {
      // Set this as the only expanded mefaresh for this section
      setExpandedMefarshim(prev => ({
        ...prev,
        [sectionIndex]: mefaresh
      }))
      
      // Auto-translate the mefaresh if not already translated
      if (!mefarshimTranslations[mefaresh.ref]) {
        try {
          setStreamingMefareshRef(mefaresh.ref)
          setStreamingMefaresh(prev => ({ ...prev, [mefaresh.ref]: '' }))
          
          const data = await SefariaAPI.getText(mefaresh.ref)
          const hebrewText = SefariaAPI.extractHebrewText(data)
          const textToTranslate = Array.isArray(hebrewText) ? hebrewText.join(' ') : hebrewText
          
          const result = await translateStream(
            textToTranslate, 
            mefaresh.ref,
            (chunk: string) => {
              setStreamingMefaresh(prev => ({
                ...prev,
                [mefaresh.ref]: (prev[mefaresh.ref] || '') + chunk
              }))
            }
          )
          
          // Update local state
          setMefarshimTranslations(prev => ({
            ...prev,
            [mefaresh.ref]: result
          }))
          
          // Clear streaming state
          setStreamingMefaresh(prev => {
            const newState = { ...prev }
            delete newState[mefaresh.ref]
            return newState
          })
          setStreamingMefareshRef(null)
        } catch (error) {
          console.error('Auto-translation failed:', error)
          setStreamingMefaresh(prev => {
            const newState = { ...prev }
            delete newState[mefaresh.ref]
            return newState
          })
          setStreamingMefareshRef(null)
        }
      }
    }
  }


  const formatDate = (date: Date | string | undefined) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return d.toLocaleDateString()
  }

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNavigate(sefariaRef)
  }

  const extractReferences = (text: string): string[] => {
    const refPattern = /([א-ת]+ [א-ת]+[:]?|[A-Za-z]+ \d+[ab]?:\d+)/g
    return Array.from(text.matchAll(refPattern)).map(match => match[0])
  }

  // Get all references from Hebrew text
  const allText = Array.isArray(hebrewText) ? hebrewText.join(' ') : hebrewText
  const references = extractReferences(allText)

  return (
    <Card
      className={cn(
        'reference-card transition-all duration-200',
        'hover:shadow-md',
        depth > 0 && 'ml-8 border-l-2 border-primary/20'
      )}
      onMouseEnter={() => setShowMetrics(true)}
      onMouseLeave={() => setShowMetrics(false)}
    >
      <div className="p-8">
        {/* Display sections or single text */}
        {Array.isArray(hebrewText) ? (
          // Display each section using GemaraSection component
          <div className="space-y-6">
            {hebrewText.map((section, idx) => (
              <GemaraSection
                key={idx}
                sectionIndex={idx}
                hebrewText={section}
                englishTranslation={sectionTranslations[idx]}
                translatingSection={translatingSection === idx}
                streamingTranslation={streamingTranslation[idx]}
                sectionLinks={sectionLinks[idx] || []}
                expandedMefaresh={expandedMefarshim[idx] || null}
                mefarshimTranslations={mefarshimTranslations}
                streamingMefareshRef={streamingMefareshRef}
                streamingMefaresh={streamingMefaresh[streamingMefareshRef || ''] || ''}
                onTranslateSection={() => handleTranslateSection(idx, section)}
                onLoadMefarshim={() => fetchSectionLinks(idx)}
                onMefareshClick={(mefaresh) => handleMefareshClick(mefaresh, idx)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          // Single text display (non-sectioned)
          <div className="flex gap-8">
            {/* English Translation - LEFT - 70% */}
            <div className="flex-1 space-y-2" style={{ flexBasis: '70%' }}>
              {isTranslating ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : translation ? (
                <div className="text-english-body leading-relaxed">
                  {translation}
                </div>
              ) : (
                <div 
                  className="text-muted-foreground italic cursor-pointer hover:text-foreground transition-colors"
                  onClick={handleTranslate}
                >
                  Click here to translate...
                </div>
              )}
            </div>

            {/* Divider */}
            <Separator orientation="vertical" className="h-auto" />

            {/* Hebrew Text - RIGHT - 30% */}
            <div className="hebrew-text" style={{ flexBasis: '30%', flexShrink: 0 }}>
              <div className="text-hebrew-body leading-relaxed">
                {hebrewText as string}
              </div>
            </div>
          </div>
        )}


        {/* Metrics */}
        <div className={cn(
          'flex items-center gap-4 text-xs text-metric transition-opacity pt-6 border-t',
          showMetrics ? 'opacity-100' : 'opacity-0'
        )}>
          {metrics?.translatedAt && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(metrics.translatedAt)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Translated</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {metrics?.lastViewed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(metrics.lastViewed)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Last viewed</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {metrics?.viewCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {metrics.viewCount}×
                  </span>
                </TooltipTrigger>
                <TooltipContent>Views</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Reference Links */}
          {references.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground">
                    {references.length} refs
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {references.slice(0, 3).map((ref, idx) => (
                      <div key={idx} className="text-xs">{ref}</div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleNavigateClick}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in new tab</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {englishTranslation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleTranslate}
                      disabled={isTranslating}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Re-translate</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}