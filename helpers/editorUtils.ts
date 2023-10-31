import type { Editor } from '~/types'

export const getSmallestContainingBlockNode = (node: Node, editor: Editor) => {
  while (!editor.dom.isBlock(node) && node.parentNode !== null) {
    node = node.parentNode
  }
  return node
}

export const getHtmlFromRange = (range: Range) => {
  const div = document.createElement('div')
  div.appendChild(range.cloneContents())
  return div.innerHTML
}
