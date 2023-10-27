import { useConverters } from './useConverters'
import { useTinymce } from '~/composables/useTinymce'

const { html2markdown, markdown2html } = useConverters()
const tinymce = useTinymce()

type Editor = typeof tinymce.activeEditor
export type LLMGenerationCall = (params: { instruction: string, contextBefore: string, targetText: string, contextAfter: string }) => Promise<string>
export type LLMMultipleGenerationCall = (params: { instruction: string, contextBefore: string, targetText: string, contextAfter: string }, numGenerations: number) => Promise<string[]>

type Range = ReturnType<Editor['selection']['getRng']>

type DialogData = {
  instruction: string,
  showContext: boolean,
  numGenerations: string,
  contextLength: 'short' | 'medium' | 'long' | 'all',
}

const CONTEXT_LENGTH = { short: 166, medium: 250, long: 400, all: 100_000 } as const

type DialogApi = Parameters<Exclude<Parameters<Editor['windowManager']['open']>[0]['onSubmit'], undefined>>[0]

const fitElementHeight = (element: HTMLElement) => {
  element.style.height = 'auto' // reduce scrollHeight if textarea was larger than content
  element.style.height = element.scrollHeight + 'px'
}

const ensureAllTextareaHeightsAreDynamic = () => {
  const textareas = document.querySelectorAll('.tox-dialog .tox-textarea')
  textareas.forEach((textarea) => {
    if (textarea instanceof HTMLElement && !textarea.classList.contains('reactive-height')) {
      textarea.classList.add('readjusts-height')
      fitElementHeight(textarea)
      textarea.addEventListener('input', () => fitElementHeight(textarea))
    }
  })
}

const focusFirstTextarea = () => {
  const textarea = document.querySelector('.tox-dialog .tox-textarea')
  if (textarea instanceof HTMLElement) {
    textarea.focus()
  }
}

const openReviewDialog = (editor: Editor, dialogApi: DialogApi, generationInput: { instruction: string, contextBefore: string, targetText: string, contextAfter: string }, generatedTexts: string[], llmGenerationCall: LLMGenerationCall) => {
  let generatedTextIndex = 0
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
        label.innerText = formatGeneratedTextLabel()
      }
    }
  })

  ensureAllTextareaHeightsAreDynamic()
  focusFirstTextarea()
}

const getHtmlFromRange = (range: Range) => {
  const div = document.createElement('div')
  div.appendChild(range.cloneContents())
  return div.innerHTML
}

const getSmallestContainingBlockNode = (node: Node, editor: Editor) => {
  while (!editor.dom.isBlock(node) && node.parentNode !== null) {
    node = node.parentNode
  }
  return node
}

export const useAiButton = (llmGenerationCall: LLMGenerationCall, llmMultipleGenerationCall: LLMMultipleGenerationCall) => {
  const onButtonClick = (editor: Editor) => {
    // Get the content of the editor before the caret position
    const range = editor.selection.getRng()
    const beforeRange = range.cloneRange()
    const afterRange = range.cloneRange()

    const beforeBlock = getSmallestContainingBlockNode(range.startContainer, editor)
    const afterBlock = getSmallestContainingBlockNode(range.endContainer, editor)

    beforeRange.setStart(editor.getBody(), 0)
    beforeRange.setEnd(beforeBlock, beforeBlock.childNodes.length)

    afterRange.setStart(afterBlock, 0)
    afterRange.setEnd(editor.getBody(), editor.getBody().childNodes.length)

    const beforeHtml = getHtmlFromRange(beforeRange)
    const afterHtml = getHtmlFromRange(afterRange)

    const beforeText = html2markdown(beforeHtml).trim()
    const targetText = html2markdown(editor.selection.getContent()).trim()
    const afterText = html2markdown(afterHtml).trim()

    const initialData = {
      instruction: '',
      showContext: false,
      numGenerations: '1',
      contextLength: 'short'
    } satisfies DialogData

    const getContexts = (contextLength: 'short' | 'medium' | 'long' | 'all') => {
      const length = CONTEXT_LENGTH[contextLength]
      return {
        contextBefore: markdown2html(beforeText).substring(beforeText.length - length + 1),
        contextAfter: markdown2html(afterText).substring(0, length)
      }
    }

    const getSourceViewHtml = (showContext: boolean, contextLength: 'short' | 'medium' | 'long') => {
      const contextDisplayValue = showContext ? 'block' : 'none'
      const { contextBefore, contextAfter } = getContexts(contextLength)
      return `<div class="source-view" style="max-height: 350px; overflow: scroll; border-radius: 6px; border: 1px solid #eee; padding: 10px; margin-bottom: 6px; margin-top: 6px;"><div class="source-view-context" style="border-bottom: 1px solid #000; margin-bottom: 10px; display: ${contextDisplayValue};">${contextBefore}</div><span style="background-color: #FFD700;">${targetText}</span><div class="source-view-context" style="border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; display: ${contextDisplayValue};">${contextAfter}</div></div>`
    }

    editor.windowManager.open({
      title: 'AI Editor',
      body: {
        type: 'panel',
        items: [
          {
            type: 'htmlpanel',
            html: '<p style="font-size: 0.8rem; color: grey">ⓘ Press ⌘ + E while the text editor is focused for a shortcut to this dialog</p>'
          },
          {
            type: 'htmlpanel',
            html: getSourceViewHtml(initialData.showContext, initialData.contextLength)
          },
          {
            type: 'bar',
            items: [
              {
                type: 'input',
                name: 'numGenerations',
                label: 'Number of Generations',
                placeholder: '1',
                inputMode: 'numeric'
              },
              {
                type: 'selectbox',
                name: 'contextLength',
                label: 'Context Length',
                size: 1, // number of visible values (optional)
                items: [
                  { value: 'short', text: 'Short' },
                  { value: 'medium', text: 'Medium' },
                  { value: 'long', text: 'Long' },
                  { value: 'all', text: 'All' }
                ]
              },
              {
                type: 'checkbox',
                name: 'showContext',
                label: 'Show context'
              }
            ]
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
      onChange: (dialogApi, details) => {
        const { showContext, contextLength } = dialogApi.getData()

        if (details.name === 'contextLength') { // update source view
          const sourceView = document.querySelector('.source-view')
          if (sourceView instanceof HTMLElement) {
            sourceView.outerHTML = getSourceViewHtml(showContext, contextLength)
          }
        } else if (details.name === 'showContext') { // update source view context
          const displayValue = showContext ? 'block' : 'none'
          const contextElements = document.querySelectorAll('.source-view-context')
          contextElements.forEach((contextElement) => {
            if (contextElement instanceof HTMLElement) {
              contextElement.style.display = displayValue
            }
          })
        }
      },
      onSubmit: async (dialogApi) => {
        const { instruction, contextLength, numGenerations } = dialogApi.getData()
        const { contextBefore, contextAfter } = getContexts(contextLength)

        dialogApi.block('Generating ...')
        const generatedTexts = await llmMultipleGenerationCall({ instruction, contextBefore, targetText, contextAfter }, parseInt(numGenerations || '1'))
        dialogApi.unblock()

        openReviewDialog(editor, dialogApi as any, { instruction, contextBefore, targetText, contextAfter }, generatedTexts, llmGenerationCall)
      }
    })

    ensureAllTextareaHeightsAreDynamic()
    focusFirstTextarea()
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
