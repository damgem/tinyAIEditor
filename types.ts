export type Editor = ReturnType<typeof useTinymce>['activeEditor']

export type Range = ReturnType<Editor['selection']['getRng']>

export type DialogActionDetails = Parameters<Exclude<Parameters<Editor['windowManager']['open']>[0]['onAction'], undefined>>[1]

export type ChatMessage = {
  type: 'ai' | 'user',
  content: string
}

export type ChatsState = {[key: string]: ChatMessage[]}
