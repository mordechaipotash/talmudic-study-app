'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Languages, ExternalLink } from 'lucide-react'
import { SefariaAPI, SefariaLink } from '@/lib/sefaria/api'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'

interface InlineCommentaryProps {
  sectionIndex: number
  baseRef: string
  commentaries: SefariaLink[]
  onNavigate: (ref: string) => void
  onLoadCommentaries?: () => void
}

interface CommentaryContent {
  ref: string
  hebrewText: string | string[]
  translation?: string
}

export function InlineCommentary({ 
  sectionIndex, 
  baseRef,
  commentaries, 
  onNavigate,
  onLoadCommentaries
}: InlineCommentaryProps) {
  const [open, setOpen] = useState(false)
  const [selectedCommentary, setSelectedCommentary] = useState<CommentaryContent | null>(null)
  const [loadingText, setLoadingText] = useState(false)
  const { translate, isTranslating } = useTranslation()

  // Group commentaries by source
  const groupedCommentaries = commentaries.reduce<Record<string, SefariaLink[]>>((acc, link) => {
    const source = link.collectiveTitle?.en || link.index_title || 'Other'
    if (!acc[source]) acc[source] = []
    acc[source].push(link)
    return acc
  }, {})

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && commentaries.length === 0 && onLoadCommentaries) {
      onLoadCommentaries()
    }
  }

  const loadCommentaryText = async (link: SefariaLink) => {
    setLoadingText(true)
    try {
      const data = await SefariaAPI.getText(link.ref)
      const hebrewText = SefariaAPI.extractHebrewText(data)
      setSelectedCommentary({
        ref: link.ref,
        hebrewText,
        translation: undefined
      })
    } catch (error) {
      console.error('Error loading commentary:', error)
    } finally {
      setLoadingText(false)
    }
  }

  const handleTranslate = async () => {
    if (!selectedCommentary) return
    
    try {
      const textToTranslate = Array.isArray(selectedCommentary.hebrewText)
        ? selectedCommentary.hebrewText.join(' ')
        : selectedCommentary.hebrewText
      
      const translation = await translate(textToTranslate, selectedCommentary.ref)
      setSelectedCommentary(prev => prev ? { ...prev, translation } : null)
    } catch (error) {
      console.error('Translation failed:', error)
    }
  }

  const commentaryCount = commentaries.length

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs",
            commentaryCount > 0 ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ChevronDown className="h-3 w-3 mr-1" />
          {commentaryCount > 0 ? `${commentaryCount} mefarshim` : 'Load mefarshim'}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm">Mefarshim on {baseRef}:{sectionIndex + 1}</h4>
        </div>
        
        <div className="grid grid-cols-2 h-96 overflow-hidden">
          {/* Commentary List */}
          <div className="h-full border-r overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-3 pr-3">
              {Object.entries(groupedCommentaries).map(([source, links]) => (
                <div key={source} className="space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {source}
                  </div>
                  {links.map((link, idx) => (
                    <Button
                      key={idx}
                      variant={selectedCommentary?.ref === link.ref ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs h-7 px-2"
                      onClick={() => loadCommentaryText(link)}
                    >
                      <span className="truncate">{link.ref.split(':').pop()}</span>
                    </Button>
                  ))}
                </div>
              ))}
              </div>
            </ScrollArea>
          </div>

          {/* Commentary Content */}
          <div className="h-full flex flex-col">
            {loadingText ? (
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : selectedCommentary ? (
              <div className="flex flex-col h-full">
                <div className="p-3 pb-2 flex items-center justify-between border-b">
                  <Badge variant="outline" className="text-xs">
                    {selectedCommentary.ref}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onNavigate(selectedCommentary.ref)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full p-3">
                    <div className="space-y-3 pr-3">
                    <p className="hebrew-text text-xs leading-relaxed">
                      {Array.isArray(selectedCommentary.hebrewText)
                        ? selectedCommentary.hebrewText.join(' ')
                        : selectedCommentary.hebrewText}
                    </p>
                    
                    {selectedCommentary.translation && (
                      <div className="text-xs leading-relaxed border-t pt-2">
                        {selectedCommentary.translation}
                      </div>
                    )}
                    </div>
                  </ScrollArea>
                </div>
                
                {!selectedCommentary.translation && (
                  <div className="p-3 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={handleTranslate}
                      disabled={isTranslating}
                    >
                      <Languages className="h-3 w-3 mr-1" />
                      {isTranslating ? 'Translating...' : 'Translate'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground text-center">
                  Select a commentary to view
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}