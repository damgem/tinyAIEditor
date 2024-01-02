<script setup lang="ts">
import Editor from '@tinymce/tinymce-vue'

const props = defineProps<{
    chatId: string,
    messageId: number,
    editable: boolean
}>()

const emit = defineEmits<{
  comment: [],
  accept: []
}>()

const chatId = computed(() => props.chatId)
const messageId = computed(() => props.messageId)

const message = useChatMessage(chatId, messageId)

onMounted(() => {
  const el = document.querySelector('.n-input__textarea-el')
  if (props.editable && el instanceof HTMLElement) {
    el.focus()
  }
})
</script>

<template>
  <div v-if="message.type === 'ai'" class="border border-solid border-gray-300 rounded-t-lg p-3 mt-2">
    <Editor
      v-model="message.content"
      :inline="true"
      :init="{statusbar: false, menubar: false, toolbar: false}"
      :disabled="true"
    />
  </div>
  <template v-else>
    <n-button class="w-full border-x border-y-0 border-solid border-gray-300 rounded-none" :bordered="false" @click="() => emit('accept')">
      Accept
    </n-button>
    <div class="border border-solid border-gray-300 rounded-b-lg">
      <div v-if="editable" class="p-3 flex items-center justify-between">
        <n-input
          v-model:value="message.content"
          type="textarea"
          placeholder="comment here ..."
          autofocus
          :autosize="{
            minRows: 1,
            maxRows: 6
          }"
        />
        <n-button class="ml-1" @click="() => emit('comment')">
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
            </svg>
          </template>
        </n-button>
      </div>
      <p v-else>
        {{ message.content }}
      </p>
    </div>
  </template>
</template>
