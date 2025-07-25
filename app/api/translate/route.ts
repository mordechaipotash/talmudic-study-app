import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OpenRouterClient } from '@/lib/openrouter/client'

export async function POST(request: NextRequest) {
  try {
    const { hebrewText, sefariaRef } = await request.json()

    if (!hebrewText || !sefariaRef) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('translations')
      .select('*')
      .eq('sefaria_ref', sefariaRef)
      .single()

    if (cached) {
      return NextResponse.json({
        translation: cached.english_translation,
        cached: true,
        model: cached.model_used,
        cost: 0
      })
    }

    // Call OpenRouter for translation
    const result = await OpenRouterClient.translate({
      hebrewText,
      sefariaRef
    })

    // Store in database
    const { error: insertError } = await supabase
      .from('translations')
      .insert({
        sefaria_ref: sefariaRef,
        hebrew_text: hebrewText,
        english_translation: result.translation,
        model_used: result.model,
        request_cost: result.cost,
        metadata: {
          user_id: user.id,
          timestamp: new Date().toISOString()
        }
      })

    if (insertError) {
      console.error('Error storing translation:', insertError)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}