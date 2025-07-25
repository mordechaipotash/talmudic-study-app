interface TranslationRequest {
  hebrewText: string
  sefariaRef: string
  context?: string
}

interface TranslationResponse {
  translation: string
  model: string
  cost: number
  cached: boolean
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash'

export class OpenRouterClient {
  static async translateStream({
    hebrewText,
    sefariaRef,
    context,
    onChunk
  }: TranslationRequest & { onChunk?: (chunk: string) => void }): Promise<TranslationResponse> {
    const systemPrompt = `You are an expert translator of Talmudic Hebrew and Aramaic texts.
Your task is to provide accurate, clear English translations while preserving the meaning and nuance of the original text.
Guidelines:
- Maintain the scholarly tone appropriate for Talmudic study
- Preserve technical terms when appropriate, with explanations in parentheses
- Keep the translation concise but complete
- Use modern, readable English while respecting the source material
- If the text contains Biblical quotes, indicate them appropriately`

    const userPrompt = `Translate the following Hebrew/Aramaic text to English:

Reference: ${sefariaRef}
${context ? `Context: ${context}\n` : ''}
Text: ${hebrewText}

Provide only the English translation, without any additional commentary or explanation.`

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Talmudic Study App',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 8000,
          stream: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Translation failed')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let translation = ''
      let cost = 0

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
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  translation += content
                  onChunk?.(content)
                }
                // Extract cost from usage if available
                if (parsed.usage?.total_cost) {
                  cost = parsed.usage.total_cost
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

      return {
        translation: translation.trim(),
        model: OPENROUTER_MODEL,
        cost,
        cached: false
      }
    } catch (error) {
      console.error('OpenRouter translation error:', error)
      throw error
    }
  }

  static async translate({
    hebrewText,
    sefariaRef,
    context
  }: TranslationRequest): Promise<TranslationResponse> {
    const systemPrompt = `You are an expert translator of Talmudic Hebrew and Aramaic texts.
Your task is to provide accurate, clear English translations while preserving the meaning and nuance of the original text.
Guidelines:
- Maintain the scholarly tone appropriate for Talmudic study
- Preserve technical terms when appropriate, with explanations in parentheses
- Keep the translation concise but complete
- Use modern, readable English while respecting the source material
- If the text contains Biblical quotes, indicate them appropriately`

    const userPrompt = `Translate the following Hebrew/Aramaic text to English:

Reference: ${sefariaRef}
${context ? `Context: ${context}\n` : ''}
Text: ${hebrewText}

Provide only the English translation, without any additional commentary or explanation.`

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Talmudic Study App',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 8000,
          stream: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Translation failed')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let translation = ''
      let cost = 0

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
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  translation += content
                }
                // Extract cost from usage if available
                if (parsed.usage?.total_cost) {
                  cost = parsed.usage.total_cost
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

      return {
        translation: translation.trim(),
        model: OPENROUTER_MODEL,
        cost,
        cached: false
      }
    } catch (error) {
      console.error('OpenRouter translation error:', error)
      throw error
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}