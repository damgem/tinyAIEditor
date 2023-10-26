<script setup lang="ts">
import { setPassword } from './composables/usePassword'

const password = ref('')

watchEffect(() => setPassword(password.value))
</script>
<template>
  <div>
    <h1 class="text-3xl m-4 ml-6">
      # TinyAIEditor
    </h1>
    <div class="m-4">
      <TheEditor />
    </div>
    <div class="absolute top-2 right-2">
      <label class="mr-4">Password:</label>
      <input v-model="password" placeholder="Enter password here...">
    </div>
  </div>
</template>
