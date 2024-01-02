export const useEditor = () => {
  const tinymce = useTinymce()
  return tinymce.get('mainEditor')
}
