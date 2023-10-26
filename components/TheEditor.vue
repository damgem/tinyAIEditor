<script setup lang="ts">
import Editor from '@tinymce/tinymce-vue'

const { tinymceApiKey } = useRuntimeConfig().public
const { getPassword } = usePassword()
const { $client } = useNuxtApp()

const aiButton = useAiButton(data => $client.llm.query({ data, password: getPassword() }))

const { markdown2html } = useConverters()

const config = {
  height: '700',
  setup: () => {
    useTinymce().PluginManager.add('ai', aiButton)
  }
}

const initialValue = markdown2html('# Welcome to TinyAIEditor!\n\nThis is an AI extension on top of the open source [TinyMCE](https://github.com/tinymce/tinymce) editor that enables an AI empowered editing workflow.\n\n**To get started:**\n- Highlight the text you wish to edit\n- Click the `AI Editor` button on the toolbar above ↑ or use the shortcut `⌘` + `E`\n- Enter your instruction in the dialog that opens and then click `Generate`\n- Wait for your generation to finish and review it\n- Click `Accept` to insert the initally highlighted text with the generated text\n\n_Try it on this document right away!_')
</script>

<template>
  <Editor
    :api-key="tinymceApiKey"
    :initial-value="initialValue"
    plugins="wordcount ai lists"
    toolbar="undo redo | blocks | bold italic | outdent indent | numlist bullist | aiButton"
    :init="config"
  />
</template>
