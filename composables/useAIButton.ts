import { openChatDialog } from './useChatDialog'
import type { Editor } from '~/types'

export const useAiButton = () => {
  const aiButton = function (editor: Editor) {
    const onAction = () => openChatDialog(editor)

    editor.ui.registry.addButton('AIButton', {
      text: 'Editor',
      icon: 'ai',
      onAction
    })

    editor.addShortcut('meta+e', 'Prompt AI', onAction)
  }

  return aiButton
}
