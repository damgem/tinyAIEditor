import { Dialog } from '@ephox/bridge'
import { ensureAllTextareasHaveDynamicHeight, focusFirstTextarea } from '~/helpers/domUtils'
import type { GenerationInputData, Editor } from '~/types'

const { markdown2html } = useConverters()

export const openReviewDialog = (editor: Editor, oldDialogApi: Dialog.DialogInstanceApi<any>, generationInput: GenerationInputData, generatedTexts: string[], llmGenerationCall: LLMGenerationCall) => {
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
        }
      ]
    },
    initialData,
    buttons: [
      {
        type: 'custom',
        name: 'previousGeneration',
        icon: 'arrow-left',
        text: 'see previous generation',
        enabled: false
      },
      {
        type: 'custom',
        name: 'nextGeneration',
        text: 'see next generation',
        icon: 'arrow-right'
      },
      {
        type: 'submit',
        text: 'Accept',
        buttonType: 'primary'
      }
    ],
    onSubmit,
    onAction
  })

  ensureAllTextareasHaveDynamicHeight()
  focusFirstTextarea()
}
