import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OpenRouterClient } from '@/lib/openrouter/client'

export async function POST(request: NextRequest) {
  try {
    const { hebrewText, sefariaRef } = await request.json()

    if (!hebrewText || !sefariaRef) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('translations')
      .select('*')
      .eq('sefaria_ref', sefariaRef)
      .single()

    if (cached) {
      // Return cached result as a stream-like response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'cached',
            translation: cached.english_translation,
            model: cached.model_used,
            cost: 0
          })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Create streaming response
    const encoder = new TextEncoder()
    let fullTranslation = ''
    let cost = 0
    let model = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await OpenRouterClient.translateStream({
            hebrewText,
            sefariaRef,
            onChunk: (chunk: string) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'chunk',
                content: chunk
              })}\n\n`))
            }
          })

          fullTranslation = result.translation
          cost = result.cost
          model = result.model

          // Store in database
          await supabase
            .from('translations')
            .insert({
              sefaria_ref: sefariaRef,
              hebrew_text: hebrewText,
              english_translation: fullTranslation,
              model_used: model,
              request_cost: cost,
              metadata: {
                user_id: user.id,
                timestamp: new Date().toISOString()
              }
            })

          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            translation: fullTranslation,
            model,
            cost
          })}\n\n`))
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming translation error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Translation failed'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Translation stream error:', error)
    return new Response(
      JSON.stringify({ error: 'Translation failed' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}