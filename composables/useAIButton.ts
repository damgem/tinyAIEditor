import { openChatDialog } from './useChatDialog'
import type { Editor, ChatsState } from '~/types'
import { getHtmlFromRange } from '~/helpers/editorUtils'

export const useAiButton = () => {
  const aiButton = function (editor: Editor) {
    const onAction = () => openChatDialog(editor)

    const onAnnotate = () => {
      editor.annotator.annotate('chat', {})
    }

    editor.ui.registry.addButton('AIButton', {
      text: 'Editor',
      icon: 'ai',
      onAction
    })

    editor.on('init', () => {
      editor.annotator.register('chat', {
        persistent: true,
        decorate: (id, _data) => {
          const chats = useState<ChatsState>('chats', () => ({}))

          const aiContent = editor.selection.getContent({ selection: true, contextual: true })

          chats.value[id] = [
            { type: 'ai', content: aiContent },
            { type: 'user', content: '' }
          ]

          return { attributes: { id } }
        }
      })

      const currentChatId = useState<string | null>('currentChatId', () => null)

      editor.annotator.annotationChanged('chat', (_status, _name, obj) => {
        currentChatId.value = obj?.uid || null
      })
    })

    editor.addShortcut('meta+shift+e', 'Prompt AI', onAction)
    editor.addShortcut('meta+e', 'Annotate', onAnnotate)
  }

  return aiButton
}
