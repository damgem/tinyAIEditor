const fitElementHeight = (element: HTMLElement) => {
  element.style.height = 'auto' // reduce scrollHeight if textarea was larger than content
  element.style.height = element.scrollHeight + 'px'
}

export const ensureAllTextareasHaveDynamicHeight = () => {
  const textareas = document.querySelectorAll('.tox-dialog .tox-textarea')

  textareas.forEach((textarea) => {
    if (!(textarea instanceof HTMLElement) || textarea.classList.contains('reactive-height')) {
      return
    }

    textarea.classList.add('readjusts-height')
    textarea.addEventListener('input', function () { fitElementHeight(this) })
    fitElementHeight(textarea)
  })
}

export const focusFirstTextarea = () => {
  const textarea = document.querySelector('.tox-dialog .tox-textarea')
  if (textarea instanceof HTMLElement) {
    textarea.focus()
  }
}
