import dotenv from 'dotenv'
dotenv.config()
import amqplib from 'amqplib'

import { Bot } from 'grammy'
import { Configuration, OpenAIApi } from 'openai'
const bot = new Bot(process.env.BOTTOKEN || '')
const configuration = new Configuration({
  apiKey: process.env.OPENAIAPIKEY,
})
const openai = new OpenAIApi(configuration)
;(async () => {
  const textPromptQueue = 'openai-text-prompt'
  const imagePromptQueue = 'openai-image-prompt'
  const conn = await amqplib.connect('amqp://localhost')

  const channel = await conn.createChannel()
  await channel.assertQueue(textPromptQueue)
  const channel2 = await conn.createChannel()
  await channel2.assertQueue(imagePromptQueue)

  // Listener
  channel.consume(textPromptQueue, async (msg: any) => {
    if (msg !== null) {
      channel.ack(msg)
      const { prompt, chatid } = JSON.parse(msg.content.toString())
      try {
        const completion = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt,
        })
        await bot.api.sendMessage(
          chatid,
          completion.data.choices[0].text || 'Please retry'
        )
      } catch (error) {
        bot.api.sendMessage(chatid, 'Please retry')
        console.log(error)
      }
    } else {
      console.log('Consumer cancelled by server')
    }
  })
  channel2.consume(imagePromptQueue, async (msg: any) => {
    if (msg !== null) {
      const { prompt, chatid } = JSON.parse(msg.content.toString())
      channel2.ack(msg)
      try {
        const imgresp: any = await openai.createImage({
          prompt,
          n: 3,
          size: '512x512',
        })
        if (imgresp.data.data.length > 0) {
          imgresp.data.data.forEach((element: any) => {
            bot.api.sendPhoto(chatid, element.url)
          })
        } else {
          bot.api.sendMessage(chatid, 'Please retry')
        }
      } catch (error) {
        console.log(error)
        bot.api.sendMessage(chatid, 'Please retry')
      }
    } else {
      console.log('Consumer cancelled by server')
    }
  })
})()
