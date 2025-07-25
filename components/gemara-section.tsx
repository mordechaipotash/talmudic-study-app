'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Languages, BookOpen, ExternalLink } from 'lucide-react'
import { SefariaLink } from '@/lib/sefaria/api'
import { cn } from '@/lib/utils'

interface GemaraSectionProps {
  sectionIndex: number
  hebrewText: string
  englishTranslation?: string
  translatingSection: boolean
  streamingTranslation?: string
  sectionLinks: SefariaLink[]
  expandedMefaresh: SefariaLink | null
  mefarshimTranslations: Record<string, string>
  streamingMefareshRef?: string | null
  streamingMefaresh?: string
  onTranslateSection: () => void
  onLoadMefarshim: () => void
  onMefareshClick: (mefaresh: SefariaLink) => void
  onNavigate: (ref: string) => void
}

export function GemaraSection({
  sectionIndex,
  hebrewText,
  englishTranslation,
  translatingSection,
  streamingTranslation,
  sectionLinks,
  expandedMefaresh,
  mefarshimTranslations,
  streamingMefareshRef,
  streamingMefaresh,
  onTranslateSection,
  onLoadMefarshim,
  onMefareshClick,
  onNavigate,
}: GemaraSectionProps) {
  const [showMefarshimButtons, setShowMefarshimButtons] = useState(false)

  return (
    <div className="border-b last:border-0 pb-6 last:pb-0">
      <div className="flex gap-8">
        {/* Section Number */}
        <div className="text-sm text-muted-foreground font-mono mt-1">
          {sectionIndex + 1}
        </div>
        
        {/* English Translation - LEFT - 70% */}
        <div className="flex-1" style={{ flexBasis: '70%' }}>
          <div className="space-y-4">
            {/* Main Gemara Translation */}
            <div>
              {translatingSection ? (
                <div className="text-english-body leading-relaxed">
                  {streamingTranslation || (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  )}
                  {streamingTranslation && (
                    <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
                  )}
                </div>
              ) : englishTranslation ? (
                <div className="text-english-body leading-relaxed">
                  {englishTranslation}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Section not translated yet
                </p>
              )}
            </div>

            {/* Expanded Mefaresh Translation */}
            {expandedMefaresh && (
              <div className="border-l-4 border-blue-200 pl-4 bg-blue-50/50 rounded-r">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    {expandedMefaresh.collectiveTitle?.en || expandedMefaresh.index_title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onNavigate(expandedMefaresh.ref)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                {streamingMefareshRef === expandedMefaresh.ref ? (
                  <div className="text-sm leading-relaxed text-gray-700">
                    {streamingMefaresh}
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
                  </div>
                ) : mefarshimTranslations[expandedMefaresh.ref] ? (
                  <div className="text-sm leading-relaxed text-gray-700">
                    {mefarshimTranslations[expandedMefaresh.ref]}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Loading translation...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <Separator orientation="vertical" className="h-auto" />

        {/* Hebrew Text - RIGHT - 30% */}
        <div 
          className="hebrew-text" 
          style={{ flexBasis: '30%', flexShrink: 0 }}
          onMouseEnter={() => setShowMefarshimButtons(true)}
          onMouseLeave={() => setShowMefarshimButtons(false)}
        >
          <div className="space-y-2">
            <div className="text-hebrew-body leading-relaxed">
              {hebrewText}
            </div>
            
            {/* Action Buttons */}
            <div className={cn(
              "flex gap-2 transition-opacity",
              showMefarshimButtons ? "opacity-100" : "opacity-0"
            )}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onTranslateSection}
                disabled={translatingSection}
              >
                <Languages className="h-3 w-3 mr-1" />
                {translatingSection ? 'Translating...' : 'Translate'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onLoadMefarshim}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                {sectionLinks.length > 0 ? `${sectionLinks.length} mefarshim` : 'Load mefarshim'}
              </Button>
            </div>
            
            {/* Mefarshim Buttons */}
            {sectionLinks.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {sectionLinks.slice(0, 8).map((mefaresh, mefareshIdx) => {
                    const isExpanded = expandedMefaresh?.ref === mefaresh.ref
                    const isTranslated = !!mefarshimTranslations[mefaresh.ref]
                    const mefareshName = mefaresh.collectiveTitle?.he || mefaresh.collectiveTitle?.en || mefaresh.index_title || 'Commentary'
                    
                    return (
                      <Button
                        key={mefareshIdx}
                        variant={isExpanded ? "secondary" : isTranslated ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-5 text-xs px-2",
                          isTranslated && !isExpanded && "bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                        )}
                        onClick={() => onMefareshClick(mefaresh)}
                      >
                        {mefareshName}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}