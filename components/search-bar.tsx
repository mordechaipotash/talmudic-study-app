'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions] = useState([
    'Berakhot 2a',
    'Shabbat 31a',
    'Sanhedrin 74b',
    'Bava Metzia 59b',
    'Kiddushin 40b',
    'Sukkah 49b',
    'Taanit 7a',
    'Megillah 6b'
  ])
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/text/${encodeURIComponent(query)}`)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/text/${encodeURIComponent(suggestion)}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a Talmudic reference (e.g., Berakhot 2a)"
          className="w-full px-4 py-3 pr-12 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <Search className="h-5 w-5" />
        </Button>
      </form>
      
      {query.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Popular texts:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}