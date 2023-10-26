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
          targetText: z.string(),
          context: z.string()
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
    )
})

// export type definition of API
export type AppRouter = typeof appRouter
