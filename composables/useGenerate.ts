import type { GenerationInput } from '~/schemas'

const { getPassword } = usePassword()

export const useGenerate = async (generationInput: Omit<GenerationInput, 'password'>) => {
  const { body } = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...generationInput, password: getPassword() })
  })

  if (!body) { throw new Error('Unknown error') }

  return body
}
