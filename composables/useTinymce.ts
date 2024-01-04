import { getTinymce } from '@tinymce/tinymce-vue/lib/cjs/main/ts/TinyMCE'
import type { TinyMCE } from 'tinymce'

export const useTinymce = () => getTinymce() as TinyMCE

export const useEditor = () => {
  const tinymce = useTinymce()
  return tinymce.get('mainEditor')
}
