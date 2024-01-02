import type { ChatsState } from '~/types'

export const useChat = (chatId: Ref<string>) => {
  const chats = useState<ChatsState>('chats', () => ({}))

  const messages = computed({
    get: () => chats.value[chatId.value],
    set: (val) => { chats.value[chatId.value] = val }
  })

  const lastMessage = computed({
    get: () => chats.value[chatId.value][chats.value[chatId.value].length - 1],
    set: (val) => { chats.value[chatId.value][chats.value[chatId.value].length - 1] = val }
  })

  return { chats, messages, lastMessage }
}
