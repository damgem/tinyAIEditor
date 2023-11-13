import { z } from 'zod'

export const GenerateInputSchema = z.object({
  data: z.object({
    instruction: z.string(),
    contextBefore: z.string(),
    targetText: z.string(),
    contextAfter: z.string()
  }),
  options: z.object({
    model: z.literal('gpt-3.5-turbo').or(z.literal('gpt-4')),
    language: z.literal('de').or(z.literal('en')),
    numGenerations: z.number().positive().optional().default(1)
  }),
  password: z.string()
})

export type GenerationInput = z.infer<typeof GenerateInputSchema>
