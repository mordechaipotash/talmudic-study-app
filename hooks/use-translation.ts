import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TranslationResult } from '@/types'

interface UseTranslationReturn {
  translate: (hebrewText: string, sefariaRef: string) => Promise<string>
  translateStream: (
    hebrewText: string, 
    sefariaRef: string, 
    onChunk: (chunk: string) => void
  ) => Promise<string>
  isTranslating: boolean
  error: string | null
  clearError: () => void
}

export function useTranslation(): UseTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const translate = useCallback(async (
    hebrewText: string, 
    sefariaRef: string
  ): Promise<string> => {
    setIsTranslating(true)
    setError(null)

    try {
      // Check cache first
      const { data: cached } = await supabase
        .from('translations')
        .select('english_translation')
        .eq('sefaria_ref', sefariaRef)
        .single()

      if (cached?.english_translation) {
        setIsTranslating(false)
        return cached.english_translation
      }

      // Call translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hebrewText, sefariaRef }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Translation failed')
      }

      const result: TranslationResult = await response.json()
      return result.translation

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed'
      setError(message)
      throw err
    } finally {
      setIsTranslating(false)
    }
  }, [supabase])

  const translateStream = useCallback(async (
    hebrewText: string,
    sefariaRef: string,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    setIsTranslating(true)
    setError(null)

    try {
      // Check cache first
      const { data: cached } = await supabase
        .from('translations')
        .select('english_translation')
        .eq('sefaria_ref', sefariaRef)
        .single()

      if (cached?.english_translation) {
        setIsTranslating(false)
        // Simulate streaming for cached content
        const words = cached.english_translation.split(' ')
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20))
          onChunk(words[i] + (i < words.length - 1 ? ' ' : ''))
        }
        return cached.english_translation
      }

      // Call streaming translation API
      const response = await fetch('/api/translate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hebrewText, sefariaRef }),
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let fullTranslation = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'chunk' && parsed.content) {
                  onChunk(parsed.content)
                  fullTranslation += parsed.content
                } else if (parsed.type === 'complete') {
                  fullTranslation = parsed.translation
                } else if (parsed.type === 'cached') {
                  fullTranslation = parsed.translation
                  // Simulate streaming for cached content
                  const words = fullTranslation.split(' ')
                  for (let i = 0; i < words.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 20))
                    onChunk(words[i] + (i < words.length - 1 ? ' ' : ''))
                  }
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.error)
                }
              } catch (e) {
                // Skip invalid JSON chunks
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      return fullTranslation

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed'
      setError(message)
      throw err
    } finally {
      setIsTranslating(false)
    }
  }, [supabase])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    translate,
    translateStream,
    isTranslating,
    error,
    clearError,
  }
}