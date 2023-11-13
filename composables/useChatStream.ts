const resolveStream = async (
  data: Ref<string>,
  onChunk: (content: string) => void,
  onReady: (content: string) => void,
  stream: ReadableStream<Uint8Array>
) => {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')

  const { value, done } = await reader.read()

  console.assert(!done)
  console.assert(decoder.decode(value, { stream: true }) === '|'.repeat(1000))

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      onReady(data.value)
      return reader.releaseLock()
    }

    const textValue = decoder.decode(value, { stream: true })

    data.value += textValue
    onChunk(textValue)
  }
}

export const useChatStream = (
  stream: ReadableStream<Uint8Array>,
  onChunk: (content: string) => void = () => {},
  onReady: (content: string) => void = () => {}
) => {
  const data = ref('')

  resolveStream(data, onChunk, onReady, stream)

  return { data: readonly(data) }
}
