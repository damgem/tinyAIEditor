import type { inferRouterInputs } from '@trpc/server'
import type { AppRouter } from '~/server/trpc/routers'

const tinymce = useTinymce()

export type Editor = typeof tinymce.activeEditor

export type Range = ReturnType<Editor['selection']['getRng']>

export type DialogActionDetails = Parameters<Exclude<Parameters<Editor['windowManager']['open']>[0]['onAction'], undefined>>[1]

export type GenerationInputData = inferRouterInputs<AppRouter>['generate']['data']
