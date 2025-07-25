import { useState, useEffect } from 'react'
import { SefariaAPI } from '@/lib/sefaria/api'

interface UseSefariaTextReturn {
  hebrewText: string | string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSefariaText(ref: string): UseSefariaTextReturn {
  const [hebrewText, setHebrewText] = useState<string | string[]>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchText = async () => {
    if (!ref) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await SefariaAPI.getText(ref)
      const text = SefariaAPI.extractHebrewText(data)
      setHebrewText(text)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load text'
      setError(message)
      console.error('Sefaria text error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchText()
  }, [ref])

  return {
    hebrewText,
    loading,
    error,
    refetch: fetchText,
  }
}

interface UseSefariaLinksReturn {
  links: any[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSefariaLinks(ref: string): UseSefariaLinksReturn {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLinks = async () => {
    if (!ref) return

    setLoading(true)
    setError(null)

    try {
      const linksData = await SefariaAPI.getLinks(ref)
      setLinks(linksData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load links'
      setError(message)
      console.error('Sefaria links error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [ref])

  return {
    links,
    loading,
    error,
    refetch: fetchLinks,
  }
}

interface UseSefariaSectionLinksReturn {
  sectionLinks: Record<number, any[]>
  loading: boolean
  error: string | null
  fetchSectionLinks: (sectionIndex: number) => Promise<void>
}

export function useSefariaSectionLinks(baseRef: string, sections: string[]): UseSefariaSectionLinksReturn {
  const [sectionLinks, setSectionLinks] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSectionLinks = async (sectionIndex: number) => {
    if (!baseRef || !sections[sectionIndex]) return

    const sectionRef = `${baseRef}:${sectionIndex + 1}`
    
    setLoading(true)
    setError(null)

    try {
      const { commentary } = await SefariaAPI.getRelatedTexts(sectionRef)
      setSectionLinks(prev => ({
        ...prev,
        [sectionIndex]: commentary
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load section links'
      setError(message)
      console.error('Sefaria section links error:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    sectionLinks,
    loading,
    error,
    fetchSectionLinks,
  }
}

interface UseSefariaSearchReturn {
  search: (query: string) => Promise<any[]>
  results: any[]
  searching: boolean
  error: string | null
}

export function useSefariaSearch(): UseSefariaSearchReturn {
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string): Promise<any[]> => {
    if (!query.trim()) {
      setResults([])
      return []
    }

    setSearching(true)
    setError(null)

    try {
      const data = await SefariaAPI.search(query)
      setResults(data.results || [])
      return data.results || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      return []
    } finally {
      setSearching(false)
    }
  }

  return {
    search,
    results,
    searching,
    error,
  }
}