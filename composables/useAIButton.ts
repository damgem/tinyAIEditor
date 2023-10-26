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

const openReviewDialog = (editor: Editor, dialogApi: DialogApi, generationInput: { instruction: string, targetText: string, context: string }, generatedText: string, llmGenerationCall: LLMGenerationCall) => {
  let generatedTextIndex = 0
  let generatedTexts = [ generatedText ]
  const formatGeneratedTextLabel = () => `Generated text (${generatedTextIndex + 1} / ${generatedTexts.length})`

  dialogApi.redial({
    title: 'Review Generation',
    body: {
      type: 'panel',
      items: [
        {
          type: 'textarea',
          name: 'generatedText',
          label: formatGeneratedTextLabel()
        }
      ]
    },
    initialData: { generatedText: generatedTexts[generatedTextIndex] },
    buttons: [
      {
        type: 'custom',
        name: 'previousGeneration',
        icon: 'arrow-left',
        text: 'see previous generation',
        enabled: false,
      },
      {
        type: 'custom',
        name: 'nextGeneration',
        text: 'see next generation',
        icon: 'arrow-right',
      },
      {
        type: 'submit',
        text: 'Accept',
        buttonType: 'primary',
      }
    ],
    onSubmit: (dialogApi) => {
      let generatedHTML = markdown2html(generatedTexts[generatedTextIndex])

      if (generatedHTML.startsWith('<p>') && generatedHTML.endsWith('</p>')) {
        generatedHTML = generatedHTML.substring(3, generatedHTML.length - 4)
      }

      editor.execCommand('mceInsertContent', false, generatedHTML)
      dialogApi.close()
    },
    onAction: async (dialogApi, details) => {
      if (details.name === 'previousGeneration') {
        generatedTextIndex -= 1
      } else if (details.name === 'nextGeneration') {
        generatedTextIndex += 1
        if(generatedTextIndex >= generatedTexts.length) {
          dialogApi.block('Generating ...')
          generatedTexts.push(await llmGenerationCall(generationInput))
          dialogApi.unblock()
        }
      }

      dialogApi.setData({ generatedText: generatedTexts[generatedTextIndex] })
      dialogApi.setEnabled('previousGeneration', generatedTextIndex > 0)
      dialogApi.setEnabled('nextGeneration', generatedTextIndex < generatedTexts.length) // ?
      
      const label = document.querySelector('.tox-form .tox-label')
      if(label instanceof HTMLElement) {
        label.innerText = formatGeneratedTextLabel()
      }
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
      buttons: [{ type: 'submit', text: 'Prompt', name: 'submitButton', buttonType: 'primary' }],
      onSubmit: async (dialogApi) => {
        const dialogData = dialogApi.getData()

        dialogApi.block('Generating ...')
        const generatedText = await llmGenerationCall(dialogData)
        dialogApi.unblock()

        openReviewDialog(editor, dialogApi as any, dialogData, generatedText, llmGenerationCall)
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
