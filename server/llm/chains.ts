import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIMessage } from 'langchain/schema'
import { LLMChain } from 'langchain/chains'
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate } from 'langchain/prompts'

const { openaiApiKey } = useRuntimeConfig()

const systemMessage = new AIMessage(
  [
    'You are my helpful personal editing assistant that is creative. I\'m editing texts in either English or German.',
    'To collaborate optimally we have established the following workflow:',
    ' - I will highlight some text',
    ' - I will write a comment or instruction regarding that text',
    ' - You\'ll be provided the exact text that I highlighted, my comment / instruction and the context in which that highlighted text appears',
    ' - You will answer with an altered version of the highlighted text. You must not try to change any text that is not highlighted or provide anything else. You must deliver the complete version of that altered text.',
    ' - Everything that you receive from me will be formatted in the Markdown format. Always answer in the same format.',
    ' - The last 2 requirements are critical to achieve efficient collaboration. Your response will replace the originally highlighted text and not following these rules will result in major editing errors.',
    ' - I will often ask you to reformulate, summarize or append something so interpret my comment in that context',
  ].join('\n')
)

const template = new PromptTemplate({
  template: [
    'Instruction or comment: {instruction}',
    '# Highlighted text',
    '{targetText}',
    '# Context',
    '{context}',
    'Restatement of my instruction or comment: {instruction}',
  ].join('\n\n'),
  inputVariables: ['instruction', 'targetText', 'context']
})

const createHumanKeyValueTemplate = (title: string, inputVariableName: string) => {
  const promptTemplate = new PromptTemplate({
    template: `## ${title}\n\n{${inputVariableName}}`,
    inputVariables: [inputVariableName]
  })

  return new HumanMessagePromptTemplate({ prompt: promptTemplate })
}

const chatPrompt = ChatPromptTemplate.fromMessages([
  systemMessage,
  createHumanKeyValueTemplate('Instruction or comment', 'instruction'),
  createHumanKeyValueTemplate('Highlighted text', 'targetText'),
  createHumanKeyValueTemplate('Context', 'context'),
  createHumanKeyValueTemplate('Restatement of my instruction or comment', 'instruction')
])

const llm = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: 'gpt-3.5-turbo',
})

export const chain = new LLMChain({ llm, prompt: chatPrompt })
