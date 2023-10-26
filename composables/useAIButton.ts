import { useConverters } from './useConverters'
import { useTinymce } from '~/composables/useTinymce'

const { html2markdown, markdown2html } = useConverters()
const tinymce = useTinymce()

type Editor = typeof tinymce.activeEditor
export type LLMGenerationCall = (params: { instruction: string, targetText: string, context: string }) => Promise<string>

type DialogData = {
  targetText: string,
  context: string,
  instruction: string
}

type DialogApi = Parameters<Exclude<Parameters<Editor['windowManager']['open']>[0]['onSubmit'], undefined>>[0]

const adjustElementHeight = (element: HTMLElement) => {
  element.style.height = 'auto' // reduce scrollHeight if textarea was larger than content
  element.style.height = element.scrollHeight + 'px'
}

const ensureAllTextareaHeightsAreDynamic = () => {
  const textareas = document.querySelectorAll('.tox-dialog .tox-textarea')
  textareas.forEach((textarea) => {
    if (textarea instanceof HTMLElement && !textarea.classList.contains('reactive-height')) {
      textarea.classList.add('readjusts-height')
      adjustElementHeight(textarea)
      textarea.addEventListener('input', () => adjustElementHeight(textarea))
    }
  })
}
const focusFirstTextarea = () => {
  const textarea = document.querySelector('.tox-dialog .tox-textarea')
  if (textarea instanceof HTMLElement) {
    textarea.focus()
  }
}

const openReviewDialog = (editor: Editor, dialogApi: DialogApi, generatedText: string) => {
  dialogApi.redial({
    title: 'Review Generation',
    body: {
      type: 'panel',
      items: [
        {
          type: 'textarea',
          name: 'generatedText',
          label: 'Generated text'
        }
      ]
    },
    initialData: { generatedText },
    buttons: [{ type: 'submit', text: 'Accept' }],
    onSubmit: (dialogApi) => {
      let generatedHTML = markdown2html(generatedText)

      if (generatedHTML.startsWith('<p>') && generatedHTML.endsWith('</p>')) {
        generatedHTML = generatedHTML.substring(3, generatedHTML.length - 4)
      }

      editor.execCommand('mceInsertContent', false, generatedHTML)
      dialogApi.close()
    }
  })
  ensureAllTextareaHeightsAreDynamic()
  focusFirstTextarea()
}

export const useAiButton = (llmGenerationCall: LLMGenerationCall) => {
  const onButtonClick = (editor: Editor) => {
    const initialData = {
      targetText: html2markdown(editor.selection.getContent()).trim(),
      context: html2markdown(editor.getContent()).trim(),
      instruction: ''
    } satisfies DialogData

    editor.windowManager.open({
      title: 'AI Editor',
      body: {
        type: 'panel',
        items: [
          {
            type: 'htmlpanel',
            html: '<p style="font-size: 0.8rem; color: grey">ⓘ Press ⌘ + E while the text editor is focused for a shortcut to this dialog</p><br>'
          },
          {
            type: 'textarea',
            name: 'targetText',
            label: 'Selected text',
            maximized: true,
            enabled: false
          },
          {
            type: 'textarea',
            name: 'context',
            label: 'Surrounding paragraph',
            maximized: true,
            enabled: false
          },
          {
            type: 'textarea',
            name: 'instruction',
            label: 'Instruction',
            placeholder: 'Write your instruction here...',
            maximized: true
          }
        ]
      },
      initialData,
      buttons: [{ type: 'submit', text: 'Prompt', name: 'submitButton' }],
      onSubmit: async (dialogApi) => {
        const dialogData = dialogApi.getData()

        dialogApi.block('Generating ...')
        const generatedText = await llmGenerationCall(dialogData)
        dialogApi.unblock()

        openReviewDialog(editor, dialogApi as any, generatedText)
      }
    })

    ensureAllTextareaHeightsAreDynamic()
  }

  const aiButton = function (editor: typeof tinymce.activeEditor) {
    editor.ui.registry.addButton('AIButton', {
      text: 'Editor',
      icon: 'ai',
      onAction: () => onButtonClick(editor)
    })

    editor.addShortcut('meta+e', 'Prompt AI', () => onButtonClick(editor))
  }

  return aiButton
}
