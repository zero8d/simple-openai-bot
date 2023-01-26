import { Bot, InputFile } from 'grammy'
import amqplib from 'amqplib'
import dotenv from 'dotenv'
dotenv.config()
const bot = new Bot(process.env.BOTTOKEN || '')

const main = async () => {
  const textPromptQueue = 'openai-text-prompt'
  const imagePromptQueue = 'openai-image-prompt'
  const conn = await amqplib.connect('amqp://localhost')
  const channel = await conn.createChannel()

  bot.command('start', ctx => {
    ctx.reply(
      "Hello! I'm here to help you with any questions or information you need. How can I assist you? \nTo use Dall-E image generation send your prompt as follows\n<code>/image A boy playing a ball</code>",
      { parse_mode: 'HTML' }
    )
  })
  bot.command('image', async ctx => {
    const text = ctx.msg.text.split('/image')[1]
    if (!text || text === '') {
      return ctx.reply(
        'To use Dall-E image generation send your prompt as follows\n<code>/image A boy playing a ball</code>',
        { parse_mode: 'HTML' }
      )
    }
    channel.sendToQueue(
      imagePromptQueue,
      Buffer.from(JSON.stringify({ chatid: ctx.chat.id, prompt: text }))
    )
    ctx.replyWithChatAction('upload_photo')
  })
  bot.on(':text', async ctx => {
    channel.sendToQueue(
      textPromptQueue,
      Buffer.from(JSON.stringify({ chatid: ctx.chat.id, prompt: ctx.msg.text }))
    )
    await ctx.replyWithChatAction('typing')
  })

  bot.start()
  bot.catch(err => console.log(err))
  console.log('Bot started')
}

main()
