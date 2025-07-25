'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronRight, Languages, BookOpen, ExternalLink } from 'lucide-react'
import { SefariaAPI, SefariaLink } from '@/lib/sefaria/api'
import { useTranslation } from '@/hooks/use-translation'
import { useSupabase } from '@/components/providers'
import { useSefariaSectionLinks } from '@/hooks/use-sefaria'
import { cn } from '@/lib/utils'

interface ExpandableMefareshProps {
  mefaresh: SefariaLink
  onNavigate: (ref: string) => void
  depth?: number
}

export function ExpandableMefaresh({ mefaresh, onNavigate, depth = 0 }: ExpandableMefareshProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hebrewText, setHebrewText] = useState<string | string[]>('')
  const [translation, setTranslation] = useState<string>('')
  const [loadingText, setLoadingText] = useState(false)
  const [sectionTranslations, setSectionTranslations] = useState<Record<number, string>>({})
  const [translatingSection, setTranslatingSection] = useState<number | null>(null)
  
  const { translate, isTranslating } = useTranslation()
  const { supabase } = useSupabase()
  
  // Get mefarshim on this mefaresh (nested commentaries)
  const { sectionLinks, fetchSectionLinks } = useSefariaSectionLinks(
    mefaresh.ref,
    Array.isArray(hebrewText) ? hebrewText : []
  )

  useEffect(() => {
    if (isExpanded && !hebrewText) {
      loadMefareshText()
    }
  }, [isExpanded])

  useEffect(() => {
    if (isExpanded && Array.isArray(hebrewText)) {
      loadSectionTranslations()
    }
  }, [hebrewText, isExpanded])

  const loadMefareshText = async () => {
    setLoadingText(true)
    try {
      const data = await SefariaAPI.getText(mefaresh.ref)
      const text = SefariaAPI.extractHebrewText(data)
      setHebrewText(text)
      
      // Also load main translation if it exists
      const { data: translationData } = await supabase
        .from('translations')
        .select('english_translation')
        .eq('sefaria_ref', mefaresh.ref)
        .single()
      
      if (translationData) {
        setTranslation(translationData.english_translation)
      }
    } catch (error) {
      console.error('Error loading mefaresh text:', error)
    } finally {
      setLoadingText(false)
    }
  }

  const loadSectionTranslations = async () => {
    if (!Array.isArray(hebrewText)) return
    
    try {
      const sectionRefs = hebrewText.map((_, idx) => `${mefaresh.ref}:${idx + 1}`)
      
      const { data } = await supabase
        .from('translations')
        .select('sefaria_ref, english_translation')
        .in('sefaria_ref', sectionRefs)
      
      if (data) {
        const translations: Record<number, string> = {}
        data.forEach((item) => {
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

  const handleTranslate = async () => {
    try {
      const textToTranslate = Array.isArray(hebrewText) ? hebrewText.join(' ') : hebrewText
      const result = await translate(textToTranslate, mefaresh.ref)
      setTranslation(result)
    } catch (error) {
      console.error('Translation failed:', error)
    }
  }

  const handleTranslateSection = async (sectionIndex: number, sectionText: string) => {
    try {
      setTranslatingSection(sectionIndex)
      const result = await translate(sectionText, `${mefaresh.ref}:${sectionIndex + 1}`)
      setSectionTranslations(prev => ({
        ...prev,
        [sectionIndex]: result
      }))
    } catch (error) {
      console.error('Section translation failed:', error)
    } finally {
      setTranslatingSection(null)
    }
  }

  const mefareshName = mefaresh.collectiveTitle?.en || mefaresh.index_title || 'Commentary'
  const hebrewName = mefaresh.collectiveTitle?.he || ''

  return (
    <Card className={cn(
      'mefaresh-card border-l-4 border-l-blue-200',
      depth > 0 && 'ml-6 border-l-orange-200',
      depth > 1 && 'ml-12 border-l-green-200'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 h-auto p-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">{mefareshName}</span>
          {hebrewName && (
            <span className="text-sm text-muted-foreground hebrew-text">
              {hebrewName}
            </span>
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {mefaresh.ref}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onNavigate(mefaresh.ref)}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <Separator className="mb-4" />
          
          {loadingText ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : Array.isArray(hebrewText) ? (
            // Sectioned mefaresh
            <div className="space-y-6">
              {hebrewText.map((section, idx) => (
                <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex gap-6">
                    {/* Section Number */}
                    <div className="text-sm text-muted-foreground font-mono mt-1">
                      {idx + 1}
                    </div>
                    
                    {/* English Translation - LEFT - 75% */}
                    <div className="flex-1" style={{ flexBasis: '75%' }}>
                      {translatingSection === idx ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : sectionTranslations[idx] ? (
                        <div className="space-y-2">
                          <p className="text-base leading-relaxed">{sectionTranslations[idx]}</p>
                          
                          {/* Nested mefarshim on this section */}
                          {sectionLinks[idx] && sectionLinks[idx].length > 0 && (
                            <div className="mt-3 space-y-2">
                              {sectionLinks[idx].slice(0, 3).map((nestedMefaresh, nestedIdx) => (
                                <ExpandableMefaresh
                                  key={nestedIdx}
                                  mefaresh={nestedMefaresh}
                                  onNavigate={onNavigate}
                                  depth={depth + 1}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-muted-foreground italic">
                            Section not translated yet
                          </p>
                          
                          {/* Show mefarshim button even if not translated */}
                          {sectionLinks[idx] && sectionLinks[idx].length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => fetchSectionLinks(idx)}
                            >
                              <BookOpen className="h-3 w-3 mr-1" />
                              {sectionLinks[idx].length} mefarshim
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <Separator orientation="vertical" className="h-auto" />

                    {/* Hebrew Text - RIGHT - 25% */}
                    <div className="hebrew-text" style={{ flexBasis: '25%', flexShrink: 0 }}>
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed">{section}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleTranslateSection(idx, section)}
                            disabled={translatingSection === idx}
                          >
                            <Languages className="h-3 w-3 mr-1" />
                            {translatingSection === idx ? 'Translating...' : 'Translate'}
                          </Button>
                          {!sectionLinks[idx] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => fetchSectionLinks(idx)}
                            >
                              <BookOpen className="h-3 w-3 mr-1" />
                              Mefarshim
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single mefaresh text
            <div className="flex gap-6">
              {/* English Translation - LEFT - 75% */}
              <div className="flex-1" style={{ flexBasis: '75%' }}>
                {translation ? (
                  <p className="text-base leading-relaxed">{translation}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Not translated yet
                  </p>
                )}
              </div>

              {/* Divider */}
              <Separator orientation="vertical" className="h-auto" />

              {/* Hebrew Text - RIGHT - 25% */}
              <div className="hebrew-text" style={{ flexBasis: '25%', flexShrink: 0 }}>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">{hebrewText}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                  >
                    <Languages className="h-3 w-3 mr-1" />
                    {isTranslating ? 'Translating...' : 'Translate'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}