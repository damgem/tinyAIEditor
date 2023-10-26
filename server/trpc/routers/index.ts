import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

import { chain } from '~/server/llm/chains'

export const appRouter = router({
  llm: publicProcedure
    .input(
      z.object({
        instruction: z.string(),
        targetText: z.string(),
        context: z.string()
      })
    )
    .query(
      async ({ input }) => {
        const result = await chain.call(input)
        return { output: result.text as string }
      }
    )
})

// export type definition of API
export type AppRouter = typeof appRouter
