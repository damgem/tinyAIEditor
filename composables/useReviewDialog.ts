import { Dialog } from '@ephox/bridge'
import { ensureAllTextareasHaveDynamicHeight, focusFirstTextarea } from '~/helpers/domUtils'
import type { Editor } from '~/types'
import type { GenerationInput } from '~/schemas'

const { markdown2html } = useConverters()

export const openReviewDialog = async (editor: Editor, generationInput: Omit<GenerationInput, 'password'>, openChatDialog: (editor: Editor, intitialInstruction?: string) => void) => {
  let dapi: Dialog.DialogInstanceApi<{generatedText: string;}> | null = null

  const stream = await useGenerate(generationInput)
  const { data: generatedText } = useChatStream(
    stream,
    () => {
      dapi?.setData({ generatedText: generatedText.value })
      ensureAllTextareasHaveDynamicHeight()
    },
    () => {
      dapi?.setEnabled('accept', true)
      dapi?.setEnabled('generatedText', true)
      focusFirstTextarea()
    }
  )

  const initialData = { generatedText: generatedText.value }

  const onSubmit = (dialogApi: Dialog.DialogInstanceApi<typeof initialData>) => {
    let generatedHTML = markdown2html(generatedText.value)

    const start = generatedHTML.startsWith('<p>') ? 3 : 0
    const end = generatedHTML.length - (generatedHTML.endsWith('</p>') ? 4 : 0)
    generatedHTML = generatedHTML.substring(start, end)

    editor.execCommand('mceInsertContent', false, generatedHTML)
    dialogApi.close()
  }

  const onAction = (dialogApi: Dialog.DialogInstanceApi<typeof initialData>, details: Dialog.DialogActionDetails) => {
    if (details.name === 'back') {
      dialogApi.close()
      openChatDialog(editor, generationInput.data.instruction)
    }
  }

  dapi = editor.windowManager.open({
    title: 'Review Generation',
    body: {
      type: 'panel',
      items: [
        {
          type: 'textarea',
          name: 'generatedText',
          label: 'Generated text:',
          enabled: false
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
        name: 'accept',
        text: 'Accept',
        buttonType: 'primary',
        enabled: false
      }
    ],
    initialData,
    onSubmit,
    onAction
  })

  ensureAllTextareasHaveDynamicHeight()
}
