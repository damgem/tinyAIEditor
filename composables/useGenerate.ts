import type { GenerationInput } from '~/schemas'

export const useGenerate = async (generationInput: GenerationInput) => {
  const { body } = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(generationInput)
  })

  if (!body) { throw new Error('Unknown error') }

  return body
}
