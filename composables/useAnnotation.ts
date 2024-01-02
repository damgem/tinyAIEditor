import { useEditor } from './useEditor'
import { getHtmlFromRange, getSmallestContainingBlockNode } from '~/helpers/editorUtils'
import type { Editor, Range } from '~/types'

const { html2markdown } = useConverters()

const getParts = (editor: Editor, range: Range) => {
  const beforeRange = range.cloneRange()
  const beforeBlock = getSmallestContainingBlockNode(range.startContainer, editor)
  beforeRange.setStart(editor.getBody(), 0)
  beforeRange.setEnd(beforeBlock, beforeBlock.childNodes.length)

  const afterRange = range.cloneRange()
  const afterBlock = getSmallestContainingBlockNode(range.endContainer, editor)
  afterRange.setStart(afterBlock, 0)
  afterRange.setEnd(editor.getBody(), editor.getBody().childNodes.length)

  const contextBefore = html2markdown(getHtmlFromRange(beforeRange)).trim()
  const targetText = html2markdown(getHtmlFromRange(range)).trim()
  const contextAfter = html2markdown(getHtmlFromRange(afterRange)).trim()

  return { targetText, contextBefore, contextAfter }
}

export const useAnnotation = (id: Ref<string>) => {
  const annotation = computed(() => useEditor().annotator.getAll('chat')[id.value])

  const data = computed(() => {
    const editor = useEditor()
    const range = editor.dom.createRng()
    range.setStartBefore(annotation.value[0])
    range.setEndAfter(annotation.value[annotation.value.length - 1])

    return getParts(editor, range)
  })

  const setTargetText = (text: string) => {
    const editor = useEditor()

    const range = editor.dom.createRng()
    range.setStartBefore(annotation.value[0])
    range.setEndAfter(annotation.value[annotation.value.length - 1])
    editor.selection.setRng(range)

    editor.execCommand('mceInsertContent', true, text)
  }

  return { data, setTargetText }
}
