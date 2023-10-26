import showdown from 'showdown'

export const useConverters = () => {
  const converter = new showdown.Converter()

  return {
    html2markdown: (html: string) => {
      const markdown = converter.makeMarkdown(html)
      // due to insertion of empty comments: https://github.com/showdownjs/showdown/issues/700
      return markdown.replace(/<!--\s*-->\s*\n/g, '')
    },
    markdown2html: (markdown: string) => converter.makeHtml(markdown)
  }
}
