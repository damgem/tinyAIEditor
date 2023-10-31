import { Dialog } from '@ephox/bridge'
import type { LLMGenerationCall, LLMMultipleGenerationCall } from './useChatDialog'
import { ensureAllTextareasHaveDynamicHeight, focusFirstTextarea } from '~/helpers/domUtils'
import type { GenerationInputData, Editor } from '~/types'

const { markdown2html } = useConverters()

export const openReviewDialog = (editor: Editor, oldDialogApi: Dialog.DialogInstanceApi<any>, generationInput: GenerationInputData, generatedTexts: string[], llmGenerationCall: LLMGenerationCall, llmMultipleGenerationCall: LLMMultipleGenerationCall, openChatDialog: (editor: Editor, llmGenerationCall: LLMGenerationCall, llmMultipleGenerationCall: LLMMultipleGenerationCall, intitialInstruction?: string) => void) => {
  let generatedTextIndex = 0

  const getGeneratedTextLabel = () => `Generated text (${generatedTextIndex + 1} / ${generatedTexts.length})`

  const initialData = { generatedText: generatedTexts[generatedTextIndex] }

  const onSubmit = (dialogApi: Dialog.DialogInstanceApi<typeof initialData>) => {
    let generatedHTML = markdown2html(generatedTexts[generatedTextIndex])

    const start = generatedHTML.startsWith('<p>') ? 3 : 0
    const end = generatedHTML.length - (generatedHTML.endsWith('</p>') ? 4 : 0)
    generatedHTML = generatedHTML.substring(start, end)

    editor.execCommand('mceInsertContent', false, generatedHTML)
    dialogApi.close()
  }

  const onAction = async (dialogApi: Dialog.DialogInstanceApi<typeof initialData>, details: Dialog.DialogActionDetails) => {
    if (details.name === 'back') {
      dialogApi.close()
      openChatDialog(editor, llmGenerationCall, llmMultipleGenerationCall, generationInput.instruction)
    }

    if (details.name === 'previousGeneration') {
      generatedTextIndex -= 1
    } else if (details.name === 'nextGeneration') {
      generatedTextIndex += 1
      if (generatedTextIndex >= generatedTexts.length) {
        dialogApi.block('Generating ...')
        generatedTexts.push(await llmGenerationCall(generationInput))
        dialogApi.unblock()
      }
    }

    dialogApi.setData({ generatedText: generatedTexts[generatedTextIndex] })
    dialogApi.setEnabled('previousGeneration', generatedTextIndex > 0)

    const label = document.querySelector('.tox-form .tox-label')
    if (label instanceof HTMLElement) {
      label.innerText = getGeneratedTextLabel()
    }
  }

  oldDialogApi.redial({
    title: 'Review Generation',
    body: {
      type: 'panel',
      items: [
        {
          type: 'textarea',
          name: 'generatedText',
          label: getGeneratedTextLabel()
        },
        {
          type: 'bar',
          items: [
            {
              type: 'button',
              name: 'previousGeneration',
              icon: 'arrow-left',
              text: 'see previous generation',
              enabled: false
            },
            {
              type: 'button',
              name: 'nextGeneration',
              text: 'see next generation',
              icon: 'arrow-right'
            }
          ]
        }
      ]
    },
    buttons: [
      {
        type: 'custom',
        name: 'back',
        text: 'Back',
        buttonType: 'secondary'
      },
      {
        type: 'submit',
        text: 'Accept',
        buttonType: 'primary'
      }
    ],
    initialData,
    onSubmit,
    onAction
  })

  ensureAllTextareasHaveDynamicHeight()
  focusFirstTextarea()
}
