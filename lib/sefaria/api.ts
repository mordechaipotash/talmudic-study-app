import { LRUCache } from 'lru-cache'

const SEFARIA_BASE_URL = 'https://www.sefaria.org/api'

// Cache for Hebrew texts (5MB max)
const textCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour
})

// Cache for links (2MB max)
const linksCache = new LRUCache<string, any>({
  max: 200,
  ttl: 1000 * 60 * 30, // 30 minutes
})

export interface SefariaTextResponse {
  ref: string
  heRef: string
  text: string | string[]
  he: string | string[]
  versions: any[]
  commentary?: any[]
}

export interface SefariaLink {
  sourceRef: string
  sourceHeRef: string
  ref: string
  heRef: string
  type: string
  category: string
  index_title?: string
  collectiveTitle?: {
    en: string
    he: string
  }
  commentator?: string
}

export class SefariaAPI {
  static async getText(ref: string, includeCommentary: boolean = false): Promise<SefariaTextResponse> {
    const cacheKey = `${ref}-${includeCommentary}`
    const cached = textCache.get(cacheKey)
    if (cached) return cached

    try {
      const params = new URLSearchParams({
        context: '0',
        ...(includeCommentary && { commentary: '1' })
      })
      
      const response = await fetch(`${SEFARIA_BASE_URL}/texts/${encodeURIComponent(ref)}?${params}`)
      if (!response.ok) {
        throw new Error(`Sefaria API error: ${response.status}`)
      }

      const data = await response.json()
      textCache.set(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching Sefaria text:', error)
      throw error
    }
  }

  static async getLinks(ref: string): Promise<SefariaLink[]> {
    const cached = linksCache.get(ref)
    if (cached) return cached

    try {
      const response = await fetch(`${SEFARIA_BASE_URL}/links/${encodeURIComponent(ref)}`)
      if (!response.ok) {
        throw new Error(`Sefaria API error: ${response.status}`)
      }

      const data = await response.json()
      linksCache.set(ref, data)
      return data
    } catch (error) {
      console.error('Error fetching Sefaria links:', error)
      throw error
    }
  }

  static async getRelatedTexts(ref: string): Promise<{ commentary: SefariaLink[], connections: SefariaLink[] }> {
    try {
      const links = await this.getLinks(ref)
      
      // Separate commentary from other connections
      const commentary = links.filter(link => 
        link.category === 'Commentary' || 
        link.type === 'commentary' ||
        link.collectiveTitle?.en?.includes('on')
      )
      
      const connections = links.filter(link => 
        link.category !== 'Commentary' && 
        link.type !== 'commentary' &&
        !link.collectiveTitle?.en?.includes('on')
      )
      
      return { commentary, connections }
    } catch (error) {
      console.error('Error fetching related texts:', error)
      return { commentary: [], connections: [] }
    }
  }

  static async search(query: string, filters?: any): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      ...(filters || {})
    })

    try {
      const response = await fetch(`${SEFARIA_BASE_URL}/search/${encodeURIComponent(query)}?${params}`)
      if (!response.ok) {
        throw new Error(`Sefaria API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Error searching Sefaria:', error)
      throw error
    }
  }

  static extractHebrewText(data: SefariaTextResponse): string | string[] {
    if (typeof data.he === 'string') {
      // Decode HTML entities
      const textarea = document.createElement('textarea')
      textarea.innerHTML = data.he
      return textarea.value
    } else if (Array.isArray(data.he)) {
      // Return array of decoded sections
      return data.he.map(section => {
        const textarea = document.createElement('textarea')
        textarea.innerHTML = section
        return textarea.value
      })
    }
    return ''
  }

  static formatReference(ref: string): string {
    // Clean up reference format
    return ref.replace(/_/g, ' ').trim()
  }
}