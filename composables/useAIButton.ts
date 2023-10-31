import { openChatDialog } from './useChatDialog'
import type { LLMGenerationCall, LLMMultipleGenerationCall } from './useChatDialog'
import type { Editor } from '~/types'

export const useAiButton = (llmGenerationCall: LLMGenerationCall, llmMultipleGenerationCall: LLMMultipleGenerationCall) => {
  const aiButton = function (editor: Editor) {
    const onAction = () => openChatDialog(editor, llmGenerationCall, llmMultipleGenerationCall)

    editor.ui.registry.addButton('AIButton', {
      text: 'Editor',
      icon: 'ai',
      onAction
    })

    editor.addShortcut('meta+e', 'Prompt AI', onAction)
  }

  return aiButton
}
