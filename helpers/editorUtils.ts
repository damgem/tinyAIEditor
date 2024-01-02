import type { Editor } from '~/types'

export const getSmallestContainingBlockNode = (node: Node, editor: Editor) => {
  while (!editor.dom.isBlock(node) && node.parentNode !== null) {
    node = node.parentNode
  }
  return node
}

const removeAnnotationSpans = (node: Node) => {
  if (!node.childNodes) {
    return
  }

  const childNodes = Array.from(node.childNodes)

  childNodes.forEach((child) => {
    if (child instanceof HTMLElement && child.tagName === 'SPAN' && child.classList.contains('test')) {
      while (child.firstChild) {
        node.insertBefore(child.firstChild, child)
      }

      node.removeChild(child)
    } else {
      removeAnnotationSpans(child)
    }
  })
}

export const getHtmlFromRange = (range: Range) => {
  const div = document.createElement('div')
  const documentFragment = range.cloneContents()

  console.log(documentFragment)

  documentFragment.childNodes.forEach((child) => {
    // removeAnnotationSpans(child)
    div.appendChild(child)
  })

  return div.innerHTML
}
