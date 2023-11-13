import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIMessage } from 'langchain/schema'
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate } from 'langchain/prompts'
import type { GenerationInput } from '~/schemas'
// import { LLMChain } from 'langchain/chains'

const { openaiApiKey } = useRuntimeConfig()

const systemMessageEn = new AIMessage(
  [
    'You are my helpful personal editing assistant that is creative. I\'m editing texts in either English or German.',
    'To collaborate optimally we have established the following workflow:',
    ' - I will highlight some text',
    ' - I will write a comment or instruction regarding that text',
    ' - You\'ll be provided the exact text that I highlighted, my comment / instruction and the context before and after the highlighted text. The context might overlap with the highlighted text a little to not break in the middle of a line.',
    ' - You will answer with an altered version of the highlighted text. You must not try to change any text that is not highlighted or provide anything else. You must deliver the complete version of that altered text.',
    ' - Everything that you receive from me will be formatted in the Markdown format. Always answer in the same format.',
    ' - The last 2 requirements are critical to achieve efficient collaboration. Your response will replace the originally highlighted text and not following these rules will result in major editing errors.',
    ' - I will often ask you to reformulate, summarize or append something so interpret my comment in that context'
  ].join('\n')
)

const systemMessageDe = new AIMessage(
  [
    'Du bist mein hilfreicher persönlicher Bearbeitungsassistent, der kreativ ist. Ich bearbeite Texte in Englisch oder Deutsch.',
    'Um optimal zusammenzuarbeiten, haben wir den folgenden Arbeitsablauf festgelegt:',
    ' - Ich werde einen Textabschnitt hervorheben',
    ' - Ich werde einen Kommentar oder eine Anweisung zu diesem Text schreiben',
    ' - Dir wird der exakte Textabschnitt, den ich hervorgehoben habe, mein Kommentar bzw. meine Anweisung sowie der Kontext vor und nach dem hervorgehobenen Text zur Verfügung gestellt. Der Kontext kann sich etwas mit dem hervorgehobenen Text überschneiden, um nicht mitten in einer Zeile zu enden.',
    ' - Du wirst mit einer geänderten Version des hervorgehobenen Textes antworten. Du darfst keinen Text ändern, der nicht hervorgehoben ist, oder etwas anderes liefern. Du musst die komplette Version des geänderten Textes liefern.',
    ' - Alles, was du von mir erhältst, wird im Markdown-Format formatiert sein. Antworte immer im gleichen Format.',
    ' - Die letzten beiden Anforderungen sind kritisch, um eine effiziente Zusammenarbeit zu erreichen. Deine Antwort wird den ursprünglich hervorgehobenen Text ersetzen und das Nichtbefolgen dieser Regeln wird zu schwerwiegenden Bearbeitungsfehlern führen.',
    ' - Ich werde dich oft bitten, etwas umzuformulieren, zusammenzufassen oder zu ergänzen, also interpretiere meinen Kommentar in diesem Kontext'
  ].join('\n')
)

const createHumanKeyValueTemplate = (title: string, inputVariableName: string) => {
  const promptTemplate = new PromptTemplate({
    template: `## ${title}\n\n{${inputVariableName}}`,
    inputVariables: [inputVariableName]
  })

  return new HumanMessagePromptTemplate({ prompt: promptTemplate })
}

const chatPromptEn = ChatPromptTemplate.fromMessages([
  systemMessageEn,
  createHumanKeyValueTemplate('Instruction or comment', 'instruction'),
  createHumanKeyValueTemplate('Context before highlighted text', 'contextBefore'),
  createHumanKeyValueTemplate('Highlighted text', 'targetText'),
  createHumanKeyValueTemplate('Context after highlighted text', 'contextAfter'),
  createHumanKeyValueTemplate('Restatement of my instruction or comment', 'instruction')
])

const chatPromptDe = ChatPromptTemplate.fromMessages([
  systemMessageDe,
  createHumanKeyValueTemplate('Anweisung oder Kommentar', 'instruction'),
  createHumanKeyValueTemplate('Kontext vor dem hervorgehobenen Text', 'contextBefore'),
  createHumanKeyValueTemplate('Hervorgehobener Text', 'targetText'),
  createHumanKeyValueTemplate('Kontext nach dem hervorgehobenen Text', 'contextAfter'),
  createHumanKeyValueTemplate('Wiederholung meiner Anweisung oder meines Kommentars', 'instruction')
])

const chatgpt3dot5turbo = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: 'gpt-3.5-turbo',
  streaming: true
})

export const chatgpt4 = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: 'gpt-4',
  streaming: true
})

export const streamChain = async (model: 'gpt-3.5-turbo' | 'gpt-4', language: 'de' | 'en', inputData: GenerationInput['data']) => {
  const chatPrompt = language === 'de' ? chatPromptDe : chatPromptEn
  const llm = model === 'gpt-4' ? chatgpt4 : chatgpt3dot5turbo

  const messages = await chatPrompt.format(inputData)
  return llm.stream(messages)
}
