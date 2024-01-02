import { streamChain } from '../llm/chains'
import { GenerateInputSchema } from '~/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { data, options: { language, model }, password: deliveredPassword } = GenerateInputSchema.parse(body)
  const { password } = useRuntimeConfig()

  if (deliveredPassword !== password) {
    createError('Password is incorrect!')
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

  const returnStream = new ReadableStream({
    start: async (controller) => {
      const textExtractStream = new TransformStream({
        transform: (chunk, controller) => {
          chunk.done ? controller.terminate() : controller.enqueue(chunk.lc_kwargs.content)
        }
      })

      const stream = await streamChain(model, language, data)
      const uint8Stream = stream.pipeThrough(textExtractStream).pipeThrough(new TextEncoderStream())
      reader = uint8Stream.getReader()
      controller.enqueue('|'.repeat(1000))
    },
    pull: async (controller) => {
      const { done, value } = await reader!.read()
      done ? controller.close() : controller.enqueue(value)
    }
  })

  return sendStream(event, returnStream)
})