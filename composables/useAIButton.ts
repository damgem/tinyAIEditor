import type { Editor, ChatsState } from '~/types'

const aiButton = function (editor: Editor) {
  const onAnnotate = () => {
    editor.annotator.annotate('chat', {})
  }

  const decorate = (id: string) => {
    const chats = useState<ChatsState>('chats', () => ({}))

    const aiContent = editor.selection.getContent({ selection: true, contextual: true })

    chats.value[id] = [
      { type: 'ai', content: aiContent },
      { type: 'user', content: '' }
    ]

    return { attributes: { id } }
  }

  editor.on('init', () => {
    editor.annotator.register('chat', {
      persistent: true,
      decorate
    })

    const currentChatId = useState<string | null>('currentChatId', () => null)

    editor.annotator.annotationChanged('chat', (_status, _name, obj) => {
      currentChatId.value = obj?.uid || null
    })
  })

  editor.addShortcut('meta+e', 'Annotate', onAnnotate)

  editor.ui.registry.addButton('AIButton', {
    text: 'Comment (⌘ + e)',
    icon: 'ai',
    onAction: onAnnotate
  })
}

export const useAiButton = () => aiButton
