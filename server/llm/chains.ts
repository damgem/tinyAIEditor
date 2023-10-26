import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIMessage } from 'langchain/schema'
import { LLMChain } from 'langchain/chains'
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate } from 'langchain/prompts'

const { openaiApiKey } = useRuntimeConfig()

const systemMessage = new AIMessage(
  [
    'You are GPT-Editor.',
    'An AI assistant that fullfills mini editor jobs in either English or German.',
    'The user will provide you with some text snippet and an comment or instruction.',
    'For you to be able to do your best, you will also get the whole paragraph in order to get the whole context.',
    'Follow the user\'s instruction.',
    'Reformulate, summarize or append depending on the user\'s comment.',
    '\nVERY IMPORTANT: Only answer with the text that will replace the original text snippet.',
    'Everything else you answer will then appear in the second draft and make it bad!'
  ].join(' ')
)

const template = new PromptTemplate({
  template:
    'Instruction: {instruction}\n\n' +
    '# Highlighted text\n\n{targetText}\n\n' +
    '# Passage for context\n\n{context}\n\n',
  inputVariables: ['instruction', 'targetText', 'context']
})

const humanTemplate = new HumanMessagePromptTemplate({ prompt: template })

const chatPrompt = ChatPromptTemplate.fromMessages([systemMessage, humanTemplate])

const llm = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: 'gpt-3.5-turbo'
})

export const chain = new LLMChain({ llm, prompt: chatPrompt })
