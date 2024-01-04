<script setup lang="ts">

import type { GenerationInput } from '~/schemas'

const props = defineProps<{
  chatId: string,
}>()

const chatId = computed(() => props.chatId)
const { data, setTargetText } = useAnnotation(chatId)

const { chats, messages, lastMessage } = useChat(chatId)
const numMessages = computed(() => messages.value.length)

const onComment = async () => {
  const generationInput = {
    data: { ...data.value, instruction: lastMessage.value.content },
    options: {
      model: 'gpt-4',
      language: 'en'
    }
  } satisfies GenerationInput

  messages.value.push({ type: 'ai', content: '' })

  const chatId = props.chatId

  const stream = await useGenerate(generationInput)
  const { data: generatedText } = useChatStream(
    stream,
    () => { chats.value[chatId][chats.value[chatId].length - 1].content = generatedText.value },
    () => { chats.value[chatId].push({ type: 'user', content: '' }) }
  )
}

const acceptMessage = (messageId: number) => setTargetText(messages.value[messageId - 1].content)
</script>

<template>
  <div class="border-2 border-solid rounded-lg px-4 py-3" style="border-color: #eee; border-radius: 11px;">
    <AiChatMessage
      v-for="i in numMessages"
      :key="i-1"
      :chat-id="chatId"
      :message-id="i-1"
      :editable="i === messages.length"
      @comment="onComment"
      @accept="() => acceptMessage(i-1)"
    />
  </div>
</template>
