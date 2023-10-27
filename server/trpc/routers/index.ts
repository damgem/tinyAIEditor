import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

import { chain } from '~/server/llm/chains'

const { password } = useRuntimeConfig()

export const appRouter = router({
  llm: publicProcedure
    .input(
      z.object({
        data: z.object({
          instruction: z.string(),
          contextBefore: z.string(),
          targetText: z.string(),
          contextAfter: z.string()
        }),
        password: z.string()
      })
    )
    .query(
      async ({ input }) => {
        if (input.password !== password) {
          return 'ERROR: THE PASSWORD IS WRONG'
        }

        const result = await chain.call(input.data)
        const resultText = result.text as string
        return resultText.split('\n').slice(2).join('\n')
      }
    ),
  llmMultiple: publicProcedure
    .input(
      z.object({
        data: z.object({
          instruction: z.string(),
          contextBefore: z.string(),
          targetText: z.string(),
          contextAfter: z.string()
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
          promises.push(chain.call(input.data))
        }

        const results = await Promise.all(promises)
        const resultTexts = results.map(result => (result.text as string).split('\n').slice(2).join('\n'))
        return resultTexts
      }
    )
})

// export type definition of API
export type AppRouter = typeof appRouter
