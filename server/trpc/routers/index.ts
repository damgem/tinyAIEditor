import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

import { chains } from '~/server/llm/chains'

const { password } = useRuntimeConfig()

export const appRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        data: z.object({
          instruction: z.string(),
          contextBefore: z.string(),
          targetText: z.string(),
          contextAfter: z.string(),
          language: z.literal('de').or(z.literal('en')),
          model: z.literal('gpt-3.5-turbo').or(z.literal('gpt-4'))
        }),
        password: z.string()
      })
    )
    .query(
      async ({ input }) => {
        if (input.password !== password) {
          return 'ERROR: THE PASSWORD IS WRONG'
        }

        const result = await chains[input.data.language][input.data.model].call({
          instruction: input.data.instruction,
          contextBefore: input.data.contextBefore,
          targetText: input.data.targetText,
          contextAfter: input.data.contextAfter
        })

        const resultText = result.text as string
        return resultText.split('\n').slice(2).join('\n')
      }
    ),
  generateMultiple: publicProcedure
    .input(
      z.object({
        data: z.object({
          instruction: z.string(),
          contextBefore: z.string(),
          targetText: z.string(),
          contextAfter: z.string(),
          language: z.literal('de').or(z.literal('en')),
          model: z.literal('gpt-3.5-turbo').or(z.literal('gpt-4'))
        }),
        numGenerations: z.number().positive(),
        password: z.string()
      })
    )
    .query(
      async ({ input }) => {
        if (input.password !== password) {
          return ['ERROR: THE PASSWORD IS WRONG']
        }

        const promises = []
        for (let i = 0; i < input.numGenerations; i += 1) {
          promises.push(chains[input.data.language][input.data.model].call({
            instruction: input.data.instruction,
            contextBefore: input.data.contextBefore,
            targetText: input.data.targetText,
            contextAfter: input.data.contextAfter
          }))
        }

        const results = await Promise.all(promises)
        const resultTexts = results.map((result) => {
          const text = result.text as string
          if (text.trim().startsWith('#')) {
            return text.split('\n').slice(2).join('\n')
          }
          return text
        })
        return resultTexts
      }
    )
})

// export type definition of API
export type AppRouter = typeof appRouter
