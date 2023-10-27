<script setup lang="ts">
import Editor from '@tinymce/tinymce-vue'

const { tinymceApiKey } = useRuntimeConfig().public
const { getPassword } = usePassword()
const { $client } = useNuxtApp()

const aiButton = useAiButton(
  data => $client.llm.query({ data, password: getPassword() }),
  (data, numGenerations: number) => $client.llmMultiple.query({ data, numGenerations, password: getPassword() })
)

const { markdown2html } = useConverters()

const config = {
  height: '700',
  setup: () => {
    const tinymce = useTinymce()
    tinymce.PluginManager.add('ai', aiButton)
  }
}

const initialValue = markdown2html("# Hey there, welcome to TinyAIEditor!\n\nThis awesome AI extension is built on top of the open source [TinyMCE](<https://github.com/tinymce/tinymce>) editor, and it's all about making your editing workflow way more chill and casual.\n\n**Ready to get started? Here's what you gotta do:**\n\n- Highlight the text you wanna edit, no pressure!\n- Look for the `AI Editor` button on the toolbar above ↑ or simply hit `⌘` \+ `E` if you prefer shortcuts\n- When the dialog pops up, just drop in your instruction and hit `Generate`\n- Have some patience while the AI works its magic, and maybe give it a cool and artistic touch yourself!\n- Feeling good about it? Click `Accept` to seamlessly insert the original highlighted text with the generated version\n\nWhy not give it a whirl on this document right away? Let's make editing a breeze! ✨🚀\n\n_(Actually this document is confusing the AI sometimes as it's referencing itself, but sure go ahead!)_")
</script>

<template>
  <Editor
    :api-key="tinymceApiKey"
    :initial-value="initialValue"
    plugins="wordcount ai lists"
    toolbar="undo redo | blocks | bold italic | aiButton | numlist bullist | outdent indent"
    :init="config"
  />
</template>
