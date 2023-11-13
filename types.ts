const tinymce = useTinymce()

export type Editor = typeof tinymce.activeEditor

export type Range = ReturnType<Editor['selection']['getRng']>

export type DialogActionDetails = Parameters<Exclude<Parameters<Editor['windowManager']['open']>[0]['onAction'], undefined>>[1]
