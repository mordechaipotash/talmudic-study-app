import { NextRequest, NextResponse } from 'next/server'
import { SefariaAPI } from '@/lib/sefaria/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ref = searchParams.get('ref')
    const action = searchParams.get('action')

    if (!ref) {
      return NextResponse.json(
        { error: 'Missing reference parameter' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'text':
        const textData = await SefariaAPI.getText(ref)
        return NextResponse.json(textData)
      
      case 'links':
        const linksData = await SefariaAPI.getLinks(ref)
        return NextResponse.json(linksData)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Sefaria API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Sefaria' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, filters } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query' },
        { status: 400 }
      )
    }

    const results = await SefariaAPI.search(query, filters)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Sefaria search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}