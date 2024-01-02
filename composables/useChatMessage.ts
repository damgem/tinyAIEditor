import type { ChatsState } from '~/types'

export const useChatMessage = (chatId: Ref<string>, messageId: Ref<number>) => {
  const chats = useState<ChatsState>('chats', () => ({}))

  const message = computed({
    get: () => chats.value[chatId.value][messageId.value],
    set: (val) => { chats.value[chatId.value][messageId.value] = val }
  })

  return message
}
