import type { Dialog } from '@ephox/bridge'
import { openReviewDialog } from './useReviewDialog'
import type { Editor, GenerationInputData } from '~/types'
import { getHtmlFromRange, getSmallestContainingBlockNode } from '~/helpers/editorUtils'
import { ensureAllTextareasHaveDynamicHeight, focusFirstTextarea } from '~/helpers/domUtils'

export type LLMGenerationCall = (params: GenerationInputData) => Promise<string>
export type LLMMultipleGenerationCall = (params: GenerationInputData, numGenerations: number) => Promise<string[]>

type ContextLength = 'short' | 'medium' | 'long' | 'all'
type DialogData = {
  instruction: string,
  showContext: boolean,
  numGenerations: string,
  contextLength: ContextLength,
}

const CONTEXT_LENGTH = { short: 166, medium: 250, long: 400, all: 100_000 } as const

const { markdown2html, html2markdown } = useConverters()

export const openChatDialog = (editor: Editor, llmGenerationCall: LLMGenerationCall, llmMultipleGenerationCall: LLMMultipleGenerationCall) => {
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

  const getContexts = (contextLength: ContextLength) => {
    const length = CONTEXT_LENGTH[contextLength]
    return {
      contextBefore: markdown2html(beforeText).substring(beforeText.length - length + 1),
      contextAfter: markdown2html(afterText).substring(0, length)
    }
  }

  const getSourceViewHtml = (showContext: boolean, contextLength: ContextLength) => {
    const contextDisplayValue = showContext ? 'block' : 'none'
    const { contextBefore, contextAfter } = getContexts(contextLength)
    return `<div class="source-view" style="max-height: 350px; overflow: scroll; border-radius: 6px; border: 1px solid #eee; padding: 10px; margin-bottom: 6px; margin-top: 6px;"><div class="source-view-context" style="border-bottom: 1px solid #000; margin-bottom: 10px; display: ${contextDisplayValue};">${contextBefore}</div><span style="background-color: #FFD700;">${targetText}</span><div class="source-view-context" style="border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; display: ${contextDisplayValue};">${contextAfter}</div></div>`
  }

  const initialData = {
    instruction: '',
    showContext: false,
    numGenerations: '1',
    contextLength: 'short'
  } satisfies DialogData

  const onChange = (dialogApi: Dialog.DialogInstanceApi<typeof initialData>, details: Dialog.DialogActionDetails) => {
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
  }

  const onSubmit = async (dialogApi: Dialog.DialogInstanceApi<typeof initialData>) => {
    const { instruction, contextLength, numGenerations } = dialogApi.getData()
    const { contextBefore, contextAfter } = getContexts(contextLength)

    dialogApi.block('Generating ...')
    const generatedTexts = await llmMultipleGenerationCall({ instruction, contextBefore, targetText, contextAfter }, parseInt(numGenerations || '1'))
    dialogApi.unblock()

    openReviewDialog(editor, dialogApi as any, { instruction, contextBefore, targetText, contextAfter }, generatedTexts, llmGenerationCall)
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
    buttons: [{
      type: 'submit',
      text: 'Prompt',
      name: 'submitButton',
      // @ts-ignore this property exists
      buttonType: 'primary'
    }],
    initialData,
    onChange,
    onSubmit
  } satisfies Dialog.DialogSpec<typeof initialData>)

  ensureAllTextareasHaveDynamicHeight()
  focusFirstTextarea()
}
