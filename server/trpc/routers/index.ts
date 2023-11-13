import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

import { chains } from '~/server/llm/chains'
export const appRouter = router({
  sayHi: publicProcedure
    .input(
      z.object({})
    )
    .query(
      () => {
        return 'hi'
      }
    )
})

// export type definition of API
export type AppRouter = typeof appRouter
